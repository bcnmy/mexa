// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../libs/Ownable.sol";
import "../libs/BaseRelayRecipient.sol";

interface ISwapRouter {

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInput(ExactInputParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactOutputSingle(ExactOutputSingleParams calldata params)
        external
        payable
        returns (uint256 amountIn);

    struct ExactOutputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
    }

    function exactOutput(ExactOutputParams calldata params)
        external
        payable
        returns (uint256 amountIn);
}

// ["0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa", "0xd0A1E359811322d97991E03f863a0C30C2cF029C"]
// ["0xd0A1E359811322d97991E03f863a0C30C2cF029C", "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"]

contract BiconomySwapper is Ownable, BaseRelayRecipient {
    address public constant ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564; // Mainnet
    address public constant NonfungiblePositionManager = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    
    using SafeERC20 for IERC20;
    ISwapRouter public iSwapRouter;
    
    //_trustedForwarder Kovan : 0xE8Df44bcaedD41586cE73eB85e409bcaa834497B
    constructor(address _trustedForwarder, address _owner) public Ownable(_owner){
        trustedForwarder = _trustedForwarder;
        iSwapRouter = ISwapRouter(ROUTER);
    }
    
    function swapWithoutETH(address _reciever, address[] memory _path, uint256 _amount) public returns(uint256) {
        require(_amount > 0 
                && _reciever != address(0) 
                && _path[0] != address(0) 
                && _path[1] != address(0), 
            "Input is not correct!!!");
        IERC20(_path[0]).safeApprove(address(iSwapRouter), 0);
        IERC20(_path[0]).safeApprove(address(iSwapRouter), _amount);
        IERC20(_path[0]).safeTransferFrom(_msgSender(), address(this), _amount);  // msg.sender => _msgSender() 
        
        ISwapRouter.ExactInputSingleParams memory fromWethToWbtcParams =
        ISwapRouter.ExactInputSingleParams(
            _path[0],
            _path[1],
            10000,
            address(this),
            block.timestamp,
            _amount,
            0,
            0
        );
        uint256 amountOut = ISwapRouter(ROUTER).exactInputSingle(fromWethToWbtcParams);
        return amountOut;
    }

    function versionRecipient() external virtual override view returns (string memory){return "1";}
    
    function setTrustedForwarder(address _trustedForwarder) public onlyOwner {
        trustedForwarder = _trustedForwarder;
    }
}