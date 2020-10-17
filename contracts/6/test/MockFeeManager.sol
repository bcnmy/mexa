pragma solidity ^0.6.8;

import "../interfaces/IFeeManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockFeeManager is IFeeManager,Ownable{
    
    uint16 bp;

    mapping(address => bool) bannedTokens;

    constructor(uint16 _bp) public{
        bp = _bp;
    }

    function getFeeMultiplier(address user, address token) external override view returns (uint16 basisPoints){
        basisPoints = bp;
    }

    function setFeeMultiplier(uint16 basisPoints) external onlyOwner{
        bp = basisPoints;
    }

    function setTokenBan(address token, bool banned) external onlyOwner{
        bannedTokens[token] = banned;
    }

    function getTokenAllowed(address token) external override view returns (bool allowed){
        allowed = !bannedTokens[token];
    }

    function getPriceFeedAddress(address token) external override view returns (address priceFeed){
        priceFeed = address(0);
    }

}