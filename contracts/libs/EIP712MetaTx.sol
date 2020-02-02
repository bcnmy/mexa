pragma solidity ^0.5.0;

import "./EIP712Base.sol";

contract EIP712MetaTx is EIP712Base {

    struct MetaTransaction {
		address contractWallet;
		uint256 nonce;
		address from;
		uint256 value;
		address dappContract;
		string methodName;
		string methodParams;
		bytes data;
	}

    bytes32 private constant META_TRANSACTION_TYPEHASH = keccak256(bytes("MetaTransaction(address contractWallet,uint256 nonce,address from,uint256 value,address dappContract,string methodName,string methodParams,bytes data)"));

    constructor(string memory name, string memory version) public EIP712Base(name, version) {
        // Empty constructor
    }

    function hashMetaTransaction(MetaTransaction memory metaTx) internal view returns (bytes32) {
		return keccak256(abi.encode(
				META_TRANSACTION_TYPEHASH,
				metaTx.contractWallet,
				metaTx.nonce,
				metaTx.from,
				metaTx.value,
				metaTx.dappContract,
				metaTx.methodName,
				metaTx.methodParams,
				keccak256(metaTx.data)
			));
	}
}