pragma solidity ^0.5.13;
import "./IGST2.sol";
import "../libs/SafeMath.sol";
import "../libs/Ownable.sol";

contract GasTokenForwarder is Ownable {
    using SafeMath for uint256;
    
    IGST2 private _gasToken;
    event Efficiency(uint256 indexed efficiency, uint256 indexed tokens);
    
    constructor(address owner, address gasToken2) public Ownable(owner){
        _gasToken = IGST2(gasToken2);
    }
    
    function forward(address payable destination, bytes memory data,uint256 mintPrice,uint256 gasLimit) public { 
        uint initialGas = gasleft();

        require(executeCall(destination, data, gasLimit),"ExecuteCall() failed");
        refundGas(initialGas,mintPrice);
    }

    function executeCall(address to, bytes memory data, uint256 gasLimit) internal returns (bool success) {
        require(
            gasleft() > ((gasLimit + (gasLimit / 63)) + 1000),
            "Not enough gas"
        );
        assembly {
            let txGas := gas
            if iszero(eq(gasLimit, 0)) {
                txGas := gasLimit
            }
            success := call(
                txGas,
                to,
                0,
                add(data, 0x20),
                mload(data),
                0,
                0
            )
        }
    }
    
    function refundGas(uint256 initialGas, uint256 mintPrice) public {
        uint256 mintBase = 32254;
        uint256 mintToken = 36543;
        uint256 freeBase = 14154;
        uint256 freeToken = 6870;
        uint256 reimburse = 24000;

        uint256 tokens = initialGas.sub(
            gasleft()).add(freeBase).div(reimburse.mul(2).sub(freeToken)
        );

        uint256 mintCost = mintBase.add(tokens.mul(mintToken));
        uint256 freeCost = freeBase.add(tokens.mul(freeToken));
        uint256 maxreimburse = tokens.mul(reimburse);

        uint256 efficiency = maxreimburse.mul(tx.gasprice).mul(100).div(
            mintCost.mul(mintPrice).add(freeCost.mul(tx.gasprice))
        );

        emit Efficiency(efficiency, tokens);
        if (efficiency > 100) {
            freeGasTokens(tokens);
        }
    }
    
    function freeGasTokens(uint256 tokens) private {
        uint256 tokensToFree = tokens;
        uint256 safeNumTokens = 0;
        uint256 gas = gasleft();

        if (gas >= 27710) {
            safeNumTokens = gas.sub(27710).div(1148 + 5722 + 150);
        }

        if (tokensToFree > safeNumTokens) {
            tokensToFree = safeNumTokens;
        }

        uint256 gasTokenBal = _gasToken.balanceOf(address(this));

        if (tokensToFree > 0 && gasTokenBal >= tokensToFree) {
            _gasToken.freeUpTo(tokensToFree);
        }

    }

    function mintGasToken( uint256 mint ) public {
        _gasToken.mint(mint);
    }

    function balanceOfGasToken(address who) external view returns (uint256){
        return _gasToken.balanceOf(who);
    }

    function freeGasToken(uint256 value) public returns (bool success){
        return _gasToken.free(value);
    }

    function freeGasTokenFrom(address from, uint256 value) public returns (bool success){
        return _gasToken.freeFrom(from, value);
    }

    function freeGasTokenFromUpTo(address from, uint256 value) public returns (uint256 freed){
        return _gasToken.freeFromUpTo(from , value);
    }

    function approveGasToken(address spender, uint256 value) public returns (bool success){
        return _gasToken.approve(spender, value);
    }

    function transferGasTokenFrom(address from, address to, uint256 value) public returns (bool success){
        return _gasToken.transferFrom(from, to, value);
    }
    
    function transferGasToken(address to, uint256 value) public returns (bool success){
        return _gasToken.transfer(to, value);
    }
}