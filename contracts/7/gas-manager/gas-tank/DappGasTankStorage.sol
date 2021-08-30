// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;


/**
 * @title Dapp Gas Tank Storage
 *
 * @notice A contract for dApps to pre deposit gas int their gas tank
 *
 *
 */

contract DappGasTankStorage {
    address payable public masterAccount;
    uint256 public minDeposit = 1e18;
    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    //Maintain balances for each funding key
    mapping(uint256 => uint256) public dappBalances;

    //Maintains fundingKey and depositedAmount information for each Depositor
    //TODO: or have parent mapping on fundingKey instead of address?
    //review
    mapping(address => mapping(uint256 => uint256) ) depositors;

    //Allowed tokens as deposit currency in Dapp Gas Tank
    mapping(address => bool) allowedTokens;
    //Pricefeeds info should you require to calculate Token/ETH
    mapping(address => address) tokenPriceFeed;

    //review
    //any other structs necessary for future implementations
    //ERC20 - dapp balances or any other book keeping
}