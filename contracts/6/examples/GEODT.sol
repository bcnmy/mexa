pragma solidity ^0.6.8;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../forwarder/BaseRelayRecipient.sol";

contract GEODT is BaseRelayRecipient {

    IUniswapV2Router02 constant public ROUTER = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    IERC20 public dai;
    IERC20 public WETH;
    address[] public path;

    constructor(address daiAddress,address WETHAddress,address forwarder) public{
        dai = IERC20(daiAddress);
        path = [daiAddress,WETHAddress];
        trustedForwarder = forwarder;
        dai.approve(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D,2**256-1);
    }

    function getEth(uint daiA, uint mEth, uint deadl) external {
        uint256 castedAmount = uint256(daiA);
        require(dai.transferFrom(_msgSender(), address(this), castedAmount),"Dai from User to GEODT failed");
        try ROUTER.swapExactTokensForETH(daiA, mEth, path, _msgSender(), deadl) {}
        catch (bytes memory reason){
            revert("swap call failed");
        }
    }

    function versionRecipient() external virtual view override returns (string memory){ return "1";}

}