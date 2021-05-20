// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libs/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ERC20TransferHandler is BaseRelayRecipient{

    constructor(address _forwarder) public {
        trustedForwarder = _forwarder;
    }

    function versionRecipient() external virtual view override returns (string memory){ return "1";}

    function transfer(address token, address to, uint256 amount) external{
        // needs safe transfer from to support USDT
        require(IERC20(token).transferFrom(_msgSender(),to,amount));
    }

}