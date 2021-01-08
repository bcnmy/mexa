pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20ForwardRequestCompatible.sol";

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

contract ERC20ForwarderStorage is ERC20ForwardRequestTypes,Ownable {
    mapping(address=>uint256) public transferHandlerGas;
    mapping(address=>bool) public safeTransferRequired;
    address public feeReceiver;
    address public oracleAggregator;
    address public feeManager;
    address payable public forwarder;
    uint128 public baseGas=21000;
    uint128 public gasRefund=19200;
}