pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TestToken.sol";

// DON'T CALL THIS CONTRACT, USE DELEGATE CALL
// DESIGNED TO BE CALLED BY DSProxy

// Mock BActions
// - transfers tokens from the forwarder to itself
// - approves the bpoolMock to spend the received token
// - calls bpoolMock
// - receives bpoolMock tokens back
// - transfers those tokens to the receiver

contract MockActions{
    IERC20 internal WETH;
    TestToken internal TokenB;

    constructor(address _WETH,address _TokenB) public{
        WETH = IERC20(_WETH);
        TokenB = TestToken(_TokenB);
    }

    function joinPool(uint256 amount) public{
        WETH.transferFrom(msg.sender,address(this),amount);
        TokenB.mint(amount);
        TokenB.transfer(msg.sender,amount);
    }
}