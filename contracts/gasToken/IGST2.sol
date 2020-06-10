pragma solidity ^0.5.10;

interface IGST2 {

    function freeUpTo(uint256 value) external returns (uint256 freed);

    function balanceOf(address who) external view returns (uint256);

    function mint(uint256 value) external;

    function free(uint256 value) external returns (bool);

    function freeFrom(address from, uint256 value) external returns (bool);

    function freeFromUpTo(address from, uint256 value) external returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);
    
    function transfer(address to, uint256 value) external returns (bool);
}