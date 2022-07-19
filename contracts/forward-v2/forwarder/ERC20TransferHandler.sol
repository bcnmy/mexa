// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract ERC20TransferHandler is ERC2771Context {

    constructor(address _forwarder) ERC2771Context(_forwarder) {
    }

    function transfer(address token, address to, uint256 amount) external{
        require(IERC20(token).transferFrom(_msgSender(),to,amount));
    }

}