//SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

// import "centre-tokens/contracts/v2/FiatTokenV2.sol";

/**
 * Basic token only for testing
 */
contract Token {
    constructor(string memory name, string memory symbol, uint256 initialBalance) public {

        // initialize(name, symbol, "USD", 18, msg.sender, msg.sender, msg.sender, msg.sender);
        // DOMAIN_SEPARATOR = EIP712.makeDomainSeparator(name, "1");
        //_initializedV2 = true;

        // balances[msg.sender] = initialBalance;
    }
}