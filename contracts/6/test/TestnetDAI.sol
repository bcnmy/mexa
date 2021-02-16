pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Testnet Dai
 * @dev ERC20 minting logic
 * Sourced from OpenZeppelin and thoroughly butchered to remove security guards.
 * Anybody can mint - STRICTLY FOR TEST PURPOSES
 */
contract TestnetDAI is ERC20{

    constructor() public ERC20("TestnetDAI", "DAI") {}

    /**
    * @dev Function to mint tokens
    * @param to The address that will receive the minted tokens.
    * @param value The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(address to, uint256 value) public returns (bool) {
        _mint(to, value);
        return true;
    }
}