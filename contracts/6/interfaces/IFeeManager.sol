pragma solidity 0.6.9;

interface IFeeManager{
    function getFeeMultiplier(address user, address token) external view returns (uint16 basisPoints); //setting max multiplier at 6.5536
    function getTokenAllowed(address token) external view returns (bool allowed);
}