pragma solidity ^0.5.0;

contract EIP712 {
    
mapping(address => uint256) public nonces;

struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
  }
  
struct MetaTransaction {
    address holder;
    uint256 nonce;
  }
  
bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
bytes32 internal constant META_TRANSACTION_TYPEHASH = keccak256(bytes("MetaTransaction(address holder,uint256 nonce)"));
bytes32 internal  DOMAIN_SEPARATOR = keccak256(abi.encode(
    EIP712_DOMAIN_TYPEHASH,
    keccak256(bytes("balancer")),
    keccak256(bytes("1")),
    42, // Kovan
    address(this)
  ));

}