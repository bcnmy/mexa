pragma solidity ^0.5.13;


import "./EIP712Base.sol";

contract EIP712MetaTx is EIP712Base {
    bytes32 private constant META_TRANSACTION_TYPEHASH = keccak256(
        bytes(
            "MetaTransaction(address from,address to,bytes data,uint256 batchId,uint256 nonce,uint256 expiry,uint256 txGas,uint256 baseGas,uint256 value,MetaInfo metaInfo,RelayerPayment relayerPayment)MetaInfo(address contractWallet)RelayerPayment(address token,uint256 amount)"
        )
    );
    bytes32 private constant META_INFO_TYPEHASH = keccak256(
        bytes("MetaInfo(address contractWallet)")
    );
    bytes32 private constant RELAYER_PAYMENT_TYPEHASH = keccak256(
        bytes("RelayerPayment(address token,uint256 amount)")
    );

    struct MetaTransaction {
        address from;
        address to;
        bytes data;
        uint256 batchId;
        uint256 nonce;
        uint256 expiry;
        uint256 txGas;
        uint256 baseGas;
        uint256 value;
        MetaInfo metaInfo;
        RelayerPayment relayerPayment;
    }

    struct MetaInfo {
        address contractWallet;
    }

    struct RelayerPayment {
        address token;
        uint256 amount;
    }

    constructor(string memory name, string memory version)
        public
        EIP712Base(name, version)
    {}

    function hash(MetaInfo memory metaInfo) internal pure returns (bytes32) {
        return
            keccak256(abi.encode(META_INFO_TYPEHASH, metaInfo.contractWallet));
    }

    function hash(RelayerPayment memory relayerPayment)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    RELAYER_PAYMENT_TYPEHASH,
                    relayerPayment.token,
                    relayerPayment.amount
                )
            );
    }

    function hashMetaTransaction(MetaTransaction memory metaTx)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    META_TRANSACTION_TYPEHASH,
                    metaTx.from,
                    metaTx.to,
                    keccak256(metaTx.data),
                    metaTx.batchId,
                    metaTx.nonce,
                    metaTx.expiry,
                    metaTx.txGas,
                    metaTx.baseGas,
                    metaTx.value,
                    hash(metaTx.metaInfo),
                    hash(metaTx.relayerPayment)
                )
            );
    }
}