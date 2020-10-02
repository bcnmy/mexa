pragma solidity ^0.6.8;

import "../interfaces/IFeeMultiplier.sol";

contract MockFeeMultiplier is IFeeMultiplier{
    uint16 bp;

    function getFeeMultiplier(address user, address token) external override returns (uint16 basisPoints){
        basisPoints = bp;
    }

    function setFeeMultiplier(uint16 basisPoints) external{
        bp = basisPoints;
    }

}