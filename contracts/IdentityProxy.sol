pragma solidity ^0.5.0;
import "./libs/Ownable.sol";
import "./libs/SafeMath.sol";
import "./token/erc20/IERC20.sol";
import "./token/erc721/IERC721.sol";

contract IdentityProxy is Ownable {
    using SafeMath for uint256;

    uint256 public nonce;
    event Forwarded (address indexed destination, uint amount, bytes data);
    event Received (address indexed sender, uint amount);
    event Withdraw (address indexed receiver, uint amount);
    address private creator;

    constructor(address owner) Ownable(owner) public {
        creator=msg.sender;
    }

    modifier onlyOwnerOrManager() {
        require(msg.sender == creator || msg.sender == owner() );
        _;
    }

    function () payable external { emit Received(msg.sender, msg.value); }

    function forward(address destination, uint amount, bytes memory data) public onlyOwnerOrManager {
        require(executeCall(destination, amount, data));
        emit Forwarded(destination, amount, data);
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(address to, uint256 value, bytes memory data) internal returns (bool success) {
        assembly {
            success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function withdraw(bytes memory _signature, string memory message, address payable receiver, uint256 amount) public returns(bool) {
        require(address(this).balance >= amount, "You dont have enough ether to withdraw");
        bytes32 _hash = getHash(message);
        require(verifySigner(_signature, _hash , owner()), "Signer address do not match with signed message");
        receiver.transfer(amount);
        nonce.add(1);
        emit Withdraw(receiver, amount);
        return true;
    }

 
    function transferERC20(bytes memory _signature, string memory message, address erc20ContractAddress, address destination, uint256 amount) public {
        require(amount >0, "Please enter a valid value");
        bytes32 _hash = getHash(message);
        require(verifySigner(_signature, _hash , owner()), "Signer address do not match with signed message");
        IERC20 erc20Token = IERC20(erc20ContractAddress);
        nonce=nonce.add(1);
        erc20Token.transfer(destination,amount);
    }

    function transferERC721(bytes memory _signature, string memory message, address erc721ContractAddress, address destination, uint256 tokenId) public { 
        bytes32 _hash = getHash(message); 
        require(verifySigner(_signature, _hash , owner()), "Signer address do not match with signed message");
        IERC721 erc721Token = IERC721(erc721ContractAddress);
        nonce=nonce.add(1);
        erc721Token.transferFrom(address(this), destination, tokenId);
    }

    function getHash(string memory message) public view returns(bytes32){
        return keccak256(abi.encodePacked(message,nonce));
    }

    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }  

    function verifySigner(bytes memory _signature, bytes32 _hash, address owner) internal pure returns (bool){
        bytes32 r;
        bytes32 s;
        uint8 v;

        //Signed it for Ethereum
        bytes32 hash = toEthSignedMessageHash(_hash);

        // Check the signature length
        if (_signature.length != 65) {
            return false;
        }
        // Divide the signature in r, s and v variables
        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }
        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return false;
        } else {
            // solium-disable-next-line arg-overflow
            return (owner == ecrecover(hash, v, r, s));
        }
    }

    function getSignatureLength(bytes memory _signature) public view returns (uint256){
            return _signature.length;
    }

    function getSignature(bytes32 hash, bytes memory _signature) public view returns(bool result, bytes32 r, bytes32 s, uint8 v, address signer) {
        bytes32 _hash = toEthSignedMessageHash(hash);
        if (_signature.length != 65) {
            result = false;
        } else {
            // Divide the signature in r, s and v variables
            // ecrecover takes the signature parameters, and the only way to get them
            // currently is to use assembly.
            // solium-disable-next-line security/no-inline-assembly
            assembly {
                r := mload(add(_signature, 32))
                s := mload(add(_signature, 64))
                v := byte(0, mload(add(_signature, 96)))
            }
            // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
            if (v < 27) {
                v += 27;
            }
            // If the version is correct return the signer address
            if (v != 27 && v != 28) {
                result = false;
            } else {
                // solium-disable-next-line arg-overflow
                signer = ecrecover(_hash, v, r, s);
            }
        }
    }  
}