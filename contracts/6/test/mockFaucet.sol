// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

contract mockFaucet{
    
    function payUp(address payable to,uint256 amount) external{
        to.transfer(amount);
    }

    receive() external payable {}
}