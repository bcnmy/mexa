pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EIP712Base {
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(
        bytes(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        )
    );

    bytes32 internal domainSeperator;

    constructor(string memory name, string memory version) public {
        domainSeperator = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                getChainID(),
                address(this)
            )
        );
    }

    function getChainID() internal pure returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }

    function getDomainSeperator() internal view returns (bytes32) {
        return domainSeperator;
    }

    /**
     * Accept message hash and returns hash message in EIP712 compatible form
     * So that it can be used to recover signer from signature signed using EIP712 formatted data
     * https://eips.ethereum.org/EIPS/eip-712
     * "\\x19" makes the encoding deterministic
     * "\\x01" is the version byte to make it compatible to EIP-191
     **/
    function toTypedMessageHash(bytes32 messageHash)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked("\x19\x01", getDomainSeperator(), messageHash)
            );
    }
}

contract ERC20Forwarder is Ownable, EIP712Base("MexaERC20Forwarder","1"){

    struct Transfer{
        address from;
        address to;
        address token;
        uint256 amount;
        uint256 fee;
    }

    mapping(address=>uint256) public nonces;

    bytes32 internal constant META_TRANSACTION_TYPEHASH = 
    keccak256(bytes("Forward(address to,address token,uint256 amount,uint256 fee,uint256 nonce)"));

    function forwardEIP712(address from,address to,address token,uint256 amount,uint256 fee,bytes32 r, bytes32 s, uint8 v) external{

        Transfer memory transfer = Transfer(from,to,token,amount,fee);

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                getDomainSeperator(),
                keccak256(
                    abi.encode(
                        META_TRANSACTION_TYPEHASH,
                        transfer.to,
                        transfer.token,
                        transfer.amount,
                        transfer.fee,
                        nonces[transfer.from]
                    )
                )
            )
        );

        require(
            from == ecrecover(digest, v, r, s),
            "invalid-signatures"
        );

        nonces[from]++;
        forward(from,to,token,amount,fee);
    }

    function forwardPersonalSign(address from,address to,address token,uint256 amount,uint256 fee,bytes32 r, bytes32 s, uint8 v) external{
        bytes32 hash = prefixed(keccak256(abi.encodePacked(nonces[from], this, getChainID(), msg.sig, from, token, amount, fee)));
        address signer = ecrecover(hash, v, r, s);
        require(signer == from, "Invalid signature");

        nonces[from]++;

        forward(from,to,token,amount,fee);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    // contract wallets can call this
    function forward(address from,address to,address token,uint256 amount,uint256 fee) public{
        IERC20 token = IERC20(token);
        require(token.transferFrom(from,to,amount));
        require(token.transferFrom(from,owner(),fee));
    }

}