// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libs/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract ERC20TransferHandler is BaseRelayRecipient{

    constructor(address _forwarder) public {
        trustedForwarder = _forwarder;
    }

    function versionRecipient() external virtual view override returns (string memory){ return "1";}

    function transfer(address token, address to, uint256 amount) external{
        require(IERC20(token).transferFrom(_msgSender(),to,amount));
    }

}