// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../libs/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "../libs/Ownable.sol";


contract BiconomySwapper is BaseRelayRecipient, Ownable {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    
    IUniswapV2Router02 public iUniswapV2Router02;
    
    //_trustedForwarder Kovan : 0xE8Df44bcaedD41586cE73eB85e409bcaa834497B
    
    constructor(address _owner, address _trustedForwarder) public Ownable(_owner){
        trustedForwarder = _trustedForwarder;
        iUniswapV2Router02 = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    }
     
    function swapWithoutETH(address _reciever, address _erc20, address[] memory _path, uint256 _amount) public returns(uint256[] memory) {
        require(_amount > 0 
                && _reciever != address(0) 
                &&_erc20 != address(0) 
                && _path[0] != address(0) 
                && _path[1] != address(0), 
            "Input is not correct!!!");
        IERC20(_erc20).safeApprove(address(iUniswapV2Router02), 0);
        IERC20(_erc20).safeApprove(address(iUniswapV2Router02), _amount);
        IERC20(_erc20).safeTransferFrom(_msgSender(), address(this), _amount);  // msg.sender => _msgSender() 
        uint256[] memory amounts = iUniswapV2Router02.swapExactTokensForTokens(
            _amount, // Input amount(e.g. 100 DAI want to exchange)
            0,
            _path, 
            _reciever, // msg.sender => _msgSender()  // after swap the output erc20 token will sent to user(msg.sender)
            block.timestamp.add(3600)
        );
        return amounts;
    }
    
    function setTrustedForwarder(address _trustedForwarder) public onlyOwner {
        trustedForwarder = _trustedForwarder;
    }
    
    function versionRecipient() external view override returns (string memory) {
        return "1";
    }
}