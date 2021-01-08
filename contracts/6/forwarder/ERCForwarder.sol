//SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./ERC20Forwarder.sol";


/**
 * ERC20Forwarder deployer 
 */
contract ERCForwarder is ERC20Forwarder {
    constructor(address _feeReceiver,address _feeManager,address payable _forwarder) public {
        initialize(_feeReceiver,_feeManager,_forwarder);
        initialized = true;
    }
}