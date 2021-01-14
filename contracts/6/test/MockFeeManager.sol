pragma solidity ^0.6.8;

import "../interfaces/IFeeManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockFeeManager is IFeeManager,Ownable{
    
    uint16 bp;

    mapping(address => bool) public tokenBanned;

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
        tokenBanned[token] = !allowed;
    }

    function getTokenAllowed(address token) external override view returns (bool allowed){
        allowed = !tokenBanned[token];
    }

    function getPriceFeedAddress(address token) external view returns (address priceFeed){
        priceFeed = address(0);
    }

}