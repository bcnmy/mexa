// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./ERC20ForwardRequestTypes.sol";

/**
 * @title ERC20 Forward Storage
 *
 * @notice A contract for dApps to coordinate meta transactions paid for with ERC20 transfers
 *
 * @dev Inherits the ERC20ForwarderRequest struct via the contract of same name - essential for compatibility with The BiconomyForwarder
 * @dev Contract owner can set the feeManager contract & the feeReceiver address
 * @dev Tx Flow : call BiconomyForwarder to handle forwarding, call _transferHandler() to charge fee after
 *
 */

contract ERC20ForwarderStorage is ERC20ForwardRequestTypes{
    mapping(address=>uint256) public transferHandlerGas;
    mapping(address=>bool) public safeTransferRequired;
    address public feeReceiver;
    address public oracleAggregator;
    address public feeManager;
    address public forwarder;
    //transaction base gas
    uint128 public baseGas=21000;
    /*gas refund given for each burned CHI token. This value is calcuated from 24000*80% (24000 is EVM gas refund for each burned CHI token) - 6150 (Biconomy's gas overhead for burning each CHI token)   */
    uint128 public gasRefund=13050; 
    //gas token forwarder base gas 
    uint128 public gasTokenForwarderBaseGas = 32330;
}