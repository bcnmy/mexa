// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "../interfaces/IFeeManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockFeeManager is IFeeManager,Ownable{
    
    uint16 bp;

    mapping(address => bool) public tokenAllowed;

    constructor(uint16 _bp) public{
        bp = _bp;
    }

    function getFeeMultiplier(address user, address token) external override view returns (uint16 basisPoints){
        basisPoints = bp;
    }

    function setFeeMultiplier(uint16 basisPoints) external onlyOwner{
        bp = basisPoints;
    }

    function setTokenAllowed(address token,bool allowed) external onlyOwner{
        tokenAllowed[token] = allowed;
    }

    function getTokenAllowed(address token) external override view returns (bool allowed){
        allowed = tokenAllowed[token];
    }

    function getPriceFeedAddress(address token) external view returns (address priceFeed){
        priceFeed = address(0);
    }

}