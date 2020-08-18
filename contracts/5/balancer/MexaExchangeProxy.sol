// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// WE'RE ADDING METATRANSACTION EQUIVALENTS TO ALL METHODS THAT TAKE IN ERC20s EXCLUSIVELY

// GOING CTRL-C CTRL-V WAS A LAZY APPROACH
// --> WILL PATTERN UP WITH INTERNAL METHODS FOR ALL DUPLICATED FUNCTIONS TO REDUCE BLOAT

pragma solidity 0.5.13;
pragma experimental ABIEncoderV2;

import "../libs/EIP712BaseB.sol";

contract PoolInterface {
    function swapExactAmountIn(address, uint, address, uint, uint) external returns (uint, uint);
    function swapExactAmountOut(address, uint, address, uint, uint) external returns (uint, uint);
}

contract TokenInterface {
    function balanceOf(address) public returns (uint);
    function allowance(address, address) public returns (uint);
    function approve(address, uint) public returns (bool);
    function transfer(address, uint) public returns (bool);
    function transferFrom(address, address, uint) public returns (bool);
    function deposit() public payable;
    function withdraw(uint) public;
}

contract MexaExchangeProxy is EIP712BaseB("MexaExchangeProxy","1",42){

    bytes32 internal constant META_BATCH_SWAP_EXACT_IN_TYPEHASH = keccak256(bytes("MetaBatchSwapExactIn(Swap[] swaps,address tokenIn,address tokenOut,uint totalAmountIn,uint minTotalAmountOut)"));
    bytes32 internal constant META_BATCH_SWAP_EXACT_OUT_TYPEHASH = keccak256(bytes("MetaBatchSwapExactOut(Swap[] swaps,address tokenIn,address tokenOut,uint maxTotalAmountIn"));
    bytes32 internal constant META_BATCH_ETH_OUT_SWAP_EXACT_IN_TYPEHASH = keccak256(bytes("MetaBatchEthOutSwapExactIn(Swap[] memory swaps,address tokenIn,uint totalAmountIn,uint minTotalAmountOut)"));
    bytes32 internal constant META_BATCH_ETH_OUT_SWAP_EXACT_OUT_TYPEHASH = keccak256(bytes("MetaBatchEthOutSwapExactOut(Swap[] memory swaps,address tokenIn,uint maxTotalAmountIn)"));

    struct Swap {
        address pool;
        uint    tokenInParam; // tokenInAmount / maxAmountIn / limitAmountIn
        uint    tokenOutParam; // minAmountOut / tokenAmountOut / limitAmountOut
        uint    maxPrice;
    }

    event LOG_CALL(
        bytes4  indexed sig,
        address indexed caller,
        bytes           data
    ) anonymous;

    modifier _logs_() {
        emit LOG_CALL(msg.sig, msg.sender, msg.data);
        _;
    }

    modifier _lock_() {
        require(!_mutex, "ERR_REENTRY");
        _mutex = true;
        _;
        _mutex = false;
    }

    bool private _mutex;
    TokenInterface weth;

    constructor(address _weth) public {
        weth = TokenInterface(_weth);
    }

    function add(uint a, uint b) internal pure returns (uint) {
        uint c = a + b;
        require(c >= a, "ERR_ADD_OVERFLOW");
        return c;
    }

    function batchSwapExactIn(
        Swap[] memory swaps,
        address tokenIn,
        address tokenOut,
        uint totalAmountIn,
        uint minTotalAmountOut
    )   
        public
        _logs_
        _lock_
        returns (uint totalAmountOut)
    {
        TokenInterface TI = TokenInterface(tokenIn);
        TokenInterface TO = TokenInterface(tokenOut);
        require(TI.transferFrom(msg.sender, address(this), totalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < totalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountOut,) = pool.swapExactAmountIn(
                                        tokenIn,
                                        swap.tokenInParam,
                                        tokenOut,
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );
            totalAmountOut = add(tokenAmountOut, totalAmountOut);
        }
        require(totalAmountOut >= minTotalAmountOut, "ERR_LIMIT_OUT");
        require(TO.transfer(msg.sender, TO.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        require(TI.transfer(msg.sender, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        return totalAmountOut;
    }

    function metaBatchSwapExactIn(
        address from,
        Swap[] memory swaps,
        address tokenIn,
        address tokenOut,
        uint totalAmountIn,
        uint minTotalAmountOut,
        Signature memory signature
    )   
        public
        _logs_
        _lock_
        returns (uint totalAmountOut)
    {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        META_BATCH_SWAP_EXACT_IN_TYPEHASH,
                        swaps,
                        tokenIn,
                        tokenOut,
                        totalAmountIn,
                        minTotalAmountOut
                    )
                )
            )
        );
        require(from != address(0), "invalid-address-0");
        require(
            from == ecrecover(digest, signature.v, signature.r, signature.s),
            "invalid-signatures"
        );
        TokenInterface TI = TokenInterface(tokenIn);
        TokenInterface TO = TokenInterface(tokenOut);
        require(TI.transferFrom(from, address(this), totalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < totalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountOut,) = pool.swapExactAmountIn(
                                        tokenIn,
                                        swap.tokenInParam,
                                        tokenOut,
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );
            totalAmountOut = add(tokenAmountOut, totalAmountOut);
        }
        require(totalAmountOut >= minTotalAmountOut, "ERR_LIMIT_OUT");
        require(TO.transfer(from, TO.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        require(TI.transfer(from, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        return totalAmountOut;
    }

    function batchSwapExactOut(
        Swap[] memory swaps,
        address tokenIn,
        address tokenOut,
        uint maxTotalAmountIn
    )
        public
        _logs_
        _lock_
        returns (uint totalAmountIn)
    {
        TokenInterface TI = TokenInterface(tokenIn);
        TokenInterface TO = TokenInterface(tokenOut);
        require(TI.transferFrom(msg.sender, address(this), maxTotalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < maxTotalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountIn,) = pool.swapExactAmountOut(
                                        tokenIn,
                                        swap.tokenInParam,
                                        tokenOut,
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );
            totalAmountIn = add(tokenAmountIn, totalAmountIn);
        }
        require(totalAmountIn <= maxTotalAmountIn, "ERR_LIMIT_IN");
        require(TO.transfer(msg.sender, TO.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        require(TI.transfer(msg.sender, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        return totalAmountIn;
    }

    function metaBatchSwapExactOut(
        address from,
        Swap[] memory swaps,
        address tokenIn,
        address tokenOut,
        uint maxTotalAmountIn,
        Signature memory signature
    )
        public
        _logs_
        _lock_
        returns (uint totalAmountIn)
    {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        META_BATCH_SWAP_EXACT_OUT_TYPEHASH,
                        swaps,
                        tokenIn,
                        tokenOut,
                        maxTotalAmountIn
                    )
                )
            )
        );
        require(from != address(0), "invalid-address-0");
        require(
            from == ecrecover(digest, signature.v, signature.r, signature.s),
            "invalid-signatures"
        );
        TokenInterface TI = TokenInterface(tokenIn);
        TokenInterface TO = TokenInterface(tokenOut);
        require(TI.transferFrom(from, address(this), maxTotalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < maxTotalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountIn,) = pool.swapExactAmountOut(
                                        tokenIn,
                                        swap.tokenInParam,
                                        tokenOut,
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );
            totalAmountIn = add(tokenAmountIn, totalAmountIn);
        }
        require(totalAmountIn <= maxTotalAmountIn, "ERR_LIMIT_IN");
        require(TO.transfer(from, TO.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        require(TI.transfer(from, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        return totalAmountIn;
    }

    function batchEthInSwapExactIn(
        Swap[] memory swaps,
        address tokenOut,
        uint minTotalAmountOut
    )
        public payable
        _logs_
        _lock_
        returns (uint totalAmountOut)
    {
        TokenInterface TO = TokenInterface(tokenOut);
        weth.deposit.value(msg.value)();
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (weth.allowance(address(this), swap.pool) < msg.value) {
                weth.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountOut,) = pool.swapExactAmountIn(
                                        address(weth),
                                        swap.tokenInParam,
                                        tokenOut,
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );
            totalAmountOut = add(tokenAmountOut, totalAmountOut);
        }
        require(totalAmountOut >= minTotalAmountOut, "ERR_LIMIT_OUT");
        require(TO.transfer(msg.sender, TO.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        uint wethBalance = weth.balanceOf(address(this));
        if (wethBalance > 0) {
            weth.withdraw(wethBalance);
            (bool xfer,) = msg.sender.call.value(wethBalance)("");
            require(xfer, "ERR_ETH_FAILED");
        }                        
        return totalAmountOut;
    }

    function batchEthOutSwapExactIn(
        Swap[] memory swaps,
        address tokenIn,
        uint totalAmountIn,
        uint minTotalAmountOut
    )
        public
        _logs_
        _lock_
        returns (uint totalAmountOut)
    {
        TokenInterface TI = TokenInterface(tokenIn);
        require(TI.transferFrom(msg.sender, address(this), totalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < totalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountOut,) = pool.swapExactAmountIn(
                                        tokenIn,
                                        swap.tokenInParam,
                                        address(weth),
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );

            totalAmountOut = add(tokenAmountOut, totalAmountOut);
        }
        require(totalAmountOut >= minTotalAmountOut, "ERR_LIMIT_OUT");
        uint wethBalance = weth.balanceOf(address(this));
        weth.withdraw(wethBalance);
        (bool xfer,) = msg.sender.call.value(wethBalance)("");
        require(xfer, "ERR_ETH_FAILED");
        require(TI.transfer(msg.sender, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        return totalAmountOut;
    }

    function metaEthOutSwapExactIn(
        address from,
        Swap[] memory swaps,
        address tokenIn,
        uint totalAmountIn,
        uint minTotalAmountOut,
        Signature memory signature
    )
        public
        _logs_
        _lock_
        returns (uint totalAmountOut)
    {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        META_BATCH_ETH_OUT_SWAP_EXACT_IN_TYPEHASH,
                        swaps,
                        tokenIn,
                        totalAmountIn,
                        minTotalAmountOut
                    )
                )
            )
        );
        require(from != address(0), "invalid-address-0");
        require(
            from == ecrecover(digest, signature.v, signature.r, signature.s),
            "invalid-signatures"
        );
        TokenInterface TI = TokenInterface(tokenIn);
        require(TI.transferFrom(from, address(this), totalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < totalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountOut,) = pool.swapExactAmountIn(
                                        tokenIn,
                                        swap.tokenInParam,
                                        address(weth),
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );

            totalAmountOut = add(tokenAmountOut, totalAmountOut);
        }
        require(totalAmountOut >= minTotalAmountOut, "ERR_LIMIT_OUT");
        uint wethBalance = weth.balanceOf(address(this));
        weth.withdraw(wethBalance);
        (bool xfer,) = from.call.value(wethBalance)("");
        require(xfer, "ERR_ETH_FAILED");
        require(TI.transfer(from, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        return totalAmountOut;
    }

    function batchEthInSwapExactOut(
        Swap[] memory swaps,
        address tokenOut
    )
        public payable
        _logs_
        _lock_
        returns (uint totalAmountIn)
    {
        TokenInterface TO = TokenInterface(tokenOut);
        weth.deposit.value(msg.value)();
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (weth.allowance(address(this), swap.pool) < msg.value) {
                weth.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountIn,) = pool.swapExactAmountOut(
                                        address(weth),
                                        swap.tokenInParam,
                                        tokenOut,
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );

            totalAmountIn = add(tokenAmountIn, totalAmountIn);
        }
        require(TO.transfer(msg.sender, TO.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        uint wethBalance = weth.balanceOf(address(this));
        if (wethBalance > 0) {
            weth.withdraw(wethBalance);
            (bool xfer,) = msg.sender.call.value(wethBalance)("");
            require(xfer, "ERR_ETH_FAILED");
        }
        return totalAmountIn;
    }

    function batchEthOutSwapExactOut(
        Swap[] memory swaps,
        address tokenIn,
        uint maxTotalAmountIn
    )
        public
        _logs_
        _lock_
        returns (uint totalAmountIn)
    {
        TokenInterface TI = TokenInterface(tokenIn);
        require(TI.transferFrom(msg.sender, address(this), maxTotalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < maxTotalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountIn,) = pool.swapExactAmountOut(
                                        tokenIn,
                                        swap.tokenInParam,
                                        address(weth),
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );

            totalAmountIn = add(tokenAmountIn, totalAmountIn);
        }
        require(totalAmountIn <= maxTotalAmountIn, "ERR_LIMIT_IN");
        require(TI.transfer(msg.sender, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        uint wethBalance = weth.balanceOf(address(this));
        weth.withdraw(wethBalance);
        (bool xfer,) = msg.sender.call.value(wethBalance)("");
        require(xfer, "ERR_ETH_FAILED");
        return totalAmountIn;
    }

    function metaBatchEthOutSwapExactOut(
        address from,
        Swap[] memory swaps,
        address tokenIn,
        uint maxTotalAmountIn,
        Signature memory signature
    )
        public
        _logs_
        _lock_
        returns (uint totalAmountIn)
    {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        META_BATCH_ETH_OUT_SWAP_EXACT_OUT_TYPEHASH,
                        swaps,
                        tokenIn,
                        maxTotalAmountIn
                    )
                )
            )
        );
        require(from != address(0), "invalid-address-0");
        require(
            from == ecrecover(digest, signature.v, signature.r, signature.s),
            "invalid-signatures"
        );
        TokenInterface TI = TokenInterface(tokenIn);
        require(TI.transferFrom(from, address(this), maxTotalAmountIn), "ERR_TRANSFER_FAILED");
        for (uint i = 0; i < swaps.length; i++) {
            Swap memory swap = swaps[i];
            PoolInterface pool = PoolInterface(swap.pool);
            if (TI.allowance(address(this), swap.pool) < maxTotalAmountIn) {
                TI.approve(swap.pool, uint(-1));
            }
            (uint tokenAmountIn,) = pool.swapExactAmountOut(
                                        tokenIn,
                                        swap.tokenInParam,
                                        address(weth),
                                        swap.tokenOutParam,
                                        swap.maxPrice
                                    );

            totalAmountIn = add(tokenAmountIn, totalAmountIn);
        }
        require(totalAmountIn <= maxTotalAmountIn, "ERR_LIMIT_IN");
        require(TI.transfer(from, TI.balanceOf(address(this))), "ERR_TRANSFER_FAILED");
        uint wethBalance = weth.balanceOf(address(this));
        weth.withdraw(wethBalance);
        (bool xfer,) = from.call.value(wethBalance)("");
        require(xfer, "ERR_ETH_FAILED");
        return totalAmountIn;
    }

    function() external payable {}
}