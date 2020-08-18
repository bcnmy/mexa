pragma solidity 0.5.13;
pragma experimental ABIEncoderV2;

import "../libs/EIP712BaseB.sol";
import "../dsproxy/dsProxy.sol";
import "../token/erc20/IERC20.sol";

contract BalancerForwarder is DSAuthority, EIP712BaseB("BalancerForwarder","1",42) {
    //42 = KOVAN
    
    //all forwarder specific meta tx variables are declared here
    //meta Tx typehash and struct now cover all possible variables
    //Biconomy's balancer integration will now be fully trustless
    mapping(address => uint256) public nonces;

    bytes32 internal constant META_TRANSACTION_TYPEHASH = 
    keccak256(bytes("MetaTransaction(address signer,address to,bytes data,uint256 value,address inputToken,address outputToken,uint256 nonce)"));

    struct MetaTransaction {
        address signer;
        address to;
        bytes data;
        uint256 value;
        address inputToken;
        address outputToken;
        uint256 nonce;
    }

    bytes32 executeSig = bytes32(bytes4(keccak256("execute(address,bytes)")));

    //mapping(address => mapping(address => mapping(bytes4 => bool))) acl;
    //The above mapping has been omitted as it isn't used

    function canCall(
        address src,
        address dst,
        bytes4 sig
    ) external view returns (bool) {
        bytes32 _sig = bytes32(sig);
        return src == address(this) && executeSig == _sig ? true : false;
    }

    function forward(
        address signer,
        Signature calldata signature,
        address to,
        bytes calldata data,
        uint256 value,
        address inputToken,
        address outputToken
    ) external {
        // Authentication check
        DSAuth auth = DSAuth(to);
        require(auth.owner() == signer, "Auth Failed");

        // This saves memory in the contract and avoids the stack getting too deep
        MetaTransaction memory mtx = MetaTransaction(signer,to,data,value,inputToken,outputToken,nonces[signer]);

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        META_TRANSACTION_TYPEHASH,
                        mtx.signer,
                        mtx.to,
                        mtx.data,
                        mtx.value,
                        mtx.inputToken,
                        mtx.outputToken,
                        mtx.nonce
                    )
                )
            )
        );

        require(signer != address(0), "invalid-address-0");
        require(
            signer == ecrecover(digest, signature.v, signature.r, signature.s),
            "invalid-signatures"
        );

        _call(signer, to, data, inputToken, value, outputToken);

        nonces[signer]++;
    }

    function _call(
        address signer,
        address to,
        bytes memory data,
        address _inputToken,
        uint256 _value,
        address _outputToken
    ) internal {
        IERC20 ierc20 = IERC20(_inputToken);
        ierc20.transferFrom(signer, address(this), _value);
        ierc20.approve(to, _value);
        (bool success, ) = to.call(data);
        if (!success) {
            assembly {
                let returnDataSize := returndatasize()
                returndatacopy(0, 0, returnDataSize)
                revert(0, returnDataSize)
            }
        } else {
            IERC20 outputToken = IERC20(_outputToken);
            outputToken.transfer(signer, outputToken.balanceOf(address(this)));
        }
    }
}