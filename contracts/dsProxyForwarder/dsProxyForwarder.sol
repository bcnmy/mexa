pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./EIP712.sol";
import "../token/erc20.sol";
import "./dsProxy.sol";

contract DsaForwarder is DSAuth, EIP712 {
    bytes32 executeSig = bytes32(bytes4(keccak256("execute(address,bytes)")));

    struct Signature {
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    mapping(address => mapping(address => mapping(bytes4 => bool))) acl;

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

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        META_TRANSACTION_TYPEHASH,
                        signer,
                        nonces[signer]
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
        ERC20 erc20 = ERC20(_inputToken);
        erc20.transferFrom(signer, address(this), _value);
        erc20.approve(to, _value);
        (bool success, ) = to.call(data);
        if (!success) {
            assembly {
                let returnDataSize := returndatasize()
                returndatacopy(0, 0, returnDataSize)
                revert(0, returnDataSize)
            }
        } else {
            ERC20 outputToken = ERC20(_outputToken);
            outputToken.transfer(signer, outputToken.balanceOf(address(this)));
        }
    }
}
