pragma solidity ^0.5.0;

contract EternalStorage {
    event Forwarded(address indexed destination, uint256 amount, bytes data);
    event Received(address indexed sender, uint256 amount);
    event Withdraw(address indexed receiver, uint256 amount);
    event TransferERC20(
        address indexed tokenAddress,
        address indexed receiver,
        uint256 amount
    );
    event TransferERC721(
        address indexed tokenAddress,
        address indexed receiver,
        uint256 tokenId
    );
    mapping(uint256 => uint256) public batchNonce;
    address public creator;
    address public manager;
    address public Implementation;

    /* Upgradable Storage */
    mapping(bytes32 => uint256) uIntStorage;
    mapping(bytes32 => string) stringStorage;
    mapping(bytes32 => address) addressStorage;
    mapping(bytes32 => bytes) bytesStorage;
    mapping(bytes32 => bool) boolStorage;
    mapping(bytes32 => int256) intStorage;

}
