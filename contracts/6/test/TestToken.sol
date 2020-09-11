pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mocks BPool by receiving tokenA in and minting tokenB 1:1

contract TestToken is ERC20{
    ERC20 internal WETH;

    constructor(address _WETH) public ERC20("TEST","TEST"){
        WETH = ERC20(_WETH);
    }

    function mint(uint256 amount) public{
        WETH.transferFrom(msg.sender,address(this),amount);
        _mint(msg.sender,amount);
    }

}