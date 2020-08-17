pragma solidity 0.5.13;

contract EIP712 {

string public name;
string public version;
uint256 public chainId;

struct EIP712Domain {
  string name;
  string version;
  uint256 chainId;
  address verifyingContract;
  }

struct Signature {
  bytes32 r;
  bytes32 s;
  uint8 v;
  }
  
bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
bytes32 internal  DOMAIN_SEPARATOR;

constructor(string memory _name, string memory _version, uint256 _chainId) public{

  // inspired by how they did it in the Dai token contract
  // Fully generalised
  DOMAIN_SEPARATOR = keccak256(abi.encode(
  EIP712_DOMAIN_TYPEHASH,
  keccak256(bytes(_name)),
  keccak256(bytes(_version)),
  _chainId,
  address(this)
  ));

  name = _name;
  version = _version;
  chainId = _chainId;

  }

}