pragma solidity 0.5.13;
pragma experimental ABIEncoderV2;

import "./dsProxy.sol";
import "../libs/EIP712BaseB.sol";

contract MexaDSProxyFactory is DSProxyFactory, EIP712BaseB("MexaDSProxyFactory","1",42) {
    //42 = KOVAN

    //all factory specific meta tx variables are declared here
    bytes32 internal constant META_TRANSACTION_TYPEHASH = 
    keccak256(bytes("MetaTransaction(address holder,address authority,uint256 nonce)"));
    mapping(address => uint256) public nonces;


    //Re written build method sets the authority before transferring ownership to the user's EOA
    function metaBuild(address holder,address authority, Signature calldata signature) external returns (address payable proxy){

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        META_TRANSACTION_TYPEHASH,
                        holder,
                        authority,
                        nonces[holder]
                    )
                )
            )
        );
        require(holder != address(0), "invalid-address-0");
        require(
            holder == ecrecover(digest, signature.v, signature.r, signature.s),
            "invalid-signatures"
        );

        nonces[holder]++;

        proxy = _authorityBuild(holder,authority);

    }

    // For when we're creating a proxy for a non EIP712 compliant wallet
    function metaBuildWithBasicSign(address holder, address authority, Signature calldata signature) 
    external returns (address payable proxy){

        bytes32 hash = prefixed(keccak256(abi.encodePacked(nonces[holder], this, chainId, msg.sig, authority)));
        address signer = ecrecover(hash, signature.v, signature.r, signature.s);
        require(signer != address(0), "invalid-address-0");
        require(signer == holder, "Invalid signature");

        nonces[holder]++;

        proxy = _authorityBuild(holder,authority);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function _authorityBuild(address holder, address authority) internal returns (address payable proxy){
        proxy = address(new DSProxy(address(cache)));
        emit Created(msg.sender, holder, address(proxy), address(cache));
        DSProxy(proxy).setAuthority(DSAuthority(authority));
        DSProxy(proxy).setOwner(holder);
        isProxy[proxy] = true;
    }

}