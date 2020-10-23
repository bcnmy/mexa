pragma solidity 0.5.13;

interface ICHITOKEN{

    function freeUpTo(uint256 value) external returns (uint256 freed);

    function mint(uint256 value) external;

    function free(uint256 value) external returns (uint256);

    function freeFrom(address from, uint256 value) external returns (uint256);

    function freeFromUpTo(address from, uint256 value) external returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function transfer(address to, uint256 value) external returns (bool);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

}