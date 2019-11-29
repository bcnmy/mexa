pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";
import "./RelayerManager.sol";

contract IdentityProxyManager is Ownable(msg.sender) {

	// address[] public relayers;
	// mapping(address => bool) public relayerStatus;
	mapping(address => mapping(address => bool)) public proxyOwners;
	mapping(address => address) public proxyOwnerMap;
	RelayerManager relayerManager;

	// EVENTS
	event ProxyCreated(address indexed identityProxy, address indexed proxyOwner, address creator);
	event ProxyAdded(address indexed identityProxy, address indexed proxyOwner, address creator);
	event Forwarded (address indexed destination, uint amount, bytes data);
	// event RelayerAdded(address relayer, address owner);
	event ProxyOwnerAdded(address indexed proxy, address currentOwner, address newOwner);

	// MODIFIERS
	modifier onlyRelayer() {
		require(relayerManager.getRelayerStatus(msg.sender), "You are not allowed to perform this operation");
		_;
	}

	modifier onlyProxyOwner(address proxyOwner, address proxy) {
		require(proxyOwners[proxyOwner][proxy], "You are not the owner of proxy contract");
		_;
	}

	constructor(address relayerManagerAddress) public {
		require(relayerManagerAddress != address(0), "Manager address can not be 0");
		relayerManager = RelayerManager(relayerManagerAddress);
	}

	function addRelayerManager(address relayerManagerAddress) public onlyOwner {
    	require(relayerManagerAddress != address(0), "Manager address can not be 0");
    	relayerManager = RelayerManager(relayerManagerAddress);
    }
	function getRelayerManager() public view returns (address relayerManagerAddress){
    	relayerManagerAddress = address(relayerManager);
    }

	function createIdentityProxy(address proxyOwner) public onlyRelayer returns(address) {
		IdentityProxy identityProxy = new IdentityProxy(proxyOwner);
		proxyOwners[proxyOwner][address(identityProxy)] = true;
		proxyOwnerMap[proxyOwner] = address(identityProxy);
		emit ProxyCreated(address(identityProxy), proxyOwner, msg.sender);
		return address(identityProxy);
	}
	function addIdentityProxy(address proxyOwner,address proxyContractAddress) public onlyRelayer returns(address) {
		proxyOwners[proxyOwner][proxyContractAddress] = true;
		proxyOwnerMap[proxyOwner] = proxyContractAddress;
		emit ProxyAdded(proxyContractAddress, proxyOwner, msg.sender);
		return proxyContractAddress;
	}

	function getProxyAddress(address proxyOwner) public view returns(address) {
		address proxyAddress = proxyOwnerMap[proxyOwner];
		if(proxyOwners[proxyOwner][proxyAddress]) {
			return proxyAddress;
		}
		return address(0);
	}

	function forward(bytes32 r, bytes32 s, uint8 v, string memory message, string memory length,
	address payable proxy, address proxyOwner, address destination, uint amount, bytes memory data)
	public onlyProxyOwner(proxyOwner, proxy) onlyRelayer {
		IdentityProxy identityProxy = IdentityProxy(proxy);
		require(verifySignature(r,s,v, message, length, proxyOwner, identityProxy.getNonce()), "Signature does not match with signer");
		identityProxy.forward(destination, amount, data);
		emit Forwarded(destination, amount, data);
	}

	function withdraw(bytes32 r, bytes32 s, uint8 v, string memory message, string memory length, address proxyOwner,
	address payable receiver, uint256 amount) public onlyRelayer {
		require(proxyOwners[proxyOwner][proxyOwnerMap[proxyOwner]], "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyOwnerMap[proxyOwner]));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		require(verifySignature(r,s,v, message, length, proxyOwner, identityProxy.getNonce()), "Signature does not match with signer");
		identityProxy.withdraw(receiver, amount);
	}

	//transfer erc20 token
	function transferERC20(bytes32 r, bytes32 s, uint8 v, string memory message, string memory length, address proxyOwner,
	address erc20ContractAddress, address destination, uint256 amount) public onlyRelayer {
		require(proxyOwners[proxyOwner][proxyOwnerMap[proxyOwner]], "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyOwnerMap[proxyOwner]));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		require(verifySignature(r,s,v, message, length, proxyOwner, identityProxy.getNonce()), "Signature does not match with signer");
		identityProxy.transferERC20(erc20ContractAddress, destination, amount);
	}

	//transfer erc721 token
	function transferERC721(bytes32 r, bytes32 s, uint8 v, string memory message, string memory length,
	address proxyOwner, address erc721ContractAddress, address destination, uint256 tokenId) public onlyRelayer {
		require(proxyOwners[proxyOwner][proxyOwnerMap[proxyOwner]], "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyOwnerMap[proxyOwner]));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		require(verifySignature(r,s,v, message, length, proxyOwner, identityProxy.getNonce()), "Signature does not match with signer");
		identityProxy.transferERC721(erc721ContractAddress, destination, tokenId);
	}


	function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        uint256 temp = _i;
        while (temp != 0) {
            bstr[k--] = byte(uint8(48 + temp % 10));
            temp /= 10;
        }
        return string(bstr);
    }

    function verifySignature(bytes32 r, bytes32 s, uint8 v, string memory message,
	string memory length, address owner, uint256 nonce) public view returns (bool){
        string memory nonceStr = uint2str(nonce);
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n",length,message,nonceStr));
		return (owner == ecrecover(hash, v, r, s));
    }

}

