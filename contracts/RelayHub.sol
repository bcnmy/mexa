pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";
import "./RelayerManager.sol";
import "./ProxyManager.sol";
import "./libs/SafeMath.sol";
import "./libs/EIP712MetaTx.sol";

contract RelayHub is Ownable(msg.sender), EIP712MetaTx {
	using SafeMath for uint256;

	RelayerManager relayerManager;
	ProxyManager proxyManager;

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
		require(proxyManager.getProxyStatus(proxyOwner,proxy), "You are not the owner of proxy contract");
		_;
	}

	constructor(address relayerManagerAddress, address proxyManagerAddress) public {
		require(relayerManagerAddress != address(0), "Manager address can not be 0");
		relayerManager = RelayerManager(relayerManagerAddress);
		proxyManager = ProxyManager(proxyManagerAddress);
	}

	function addRelayerManager(address relayerManagerAddress) public onlyOwner {
    	require(relayerManagerAddress != address(0), "Manager address can not be 0");
    	relayerManager = RelayerManager(relayerManagerAddress);
    }

	function addProxyManager(address proxyManagerAddress) public onlyOwner {
		require(proxyManagerAddress != address(0), "Proxy manager address can not be 0");
		proxyManager = ProxyManager(proxyManagerAddress);
	}

	function getRelayerManager() public view returns (address relayerManagerAddress){
    	relayerManagerAddress = address(relayerManager);
    }

	function getProxyManager() public view returns (address proxyManagerAddress) {
		proxyManagerAddress = address(proxyManager);
	}

	function createIdentityProxy(address proxyOwner) public onlyRelayer {
		IdentityProxy identityProxy = new IdentityProxy(proxyOwner);
		proxyManager.addProxy(proxyOwner, address(identityProxy));
		emit ProxyCreated(address(identityProxy), proxyOwner, msg.sender);
	}

	function getProxyAddress(address proxyOwner) public view returns(address) {
		return proxyManager.getProxyAddress(proxyOwner);
	}

	function forward(bytes32 r, bytes32 s, uint8 v, string memory methodName, string memory methodParams,
	address payable proxy, address proxyOwner, address payable destination, uint256 amount, bytes memory data)
	public onlyProxyOwner(proxyOwner, proxy) onlyRelayer {
		IdentityProxy identityProxy = IdentityProxy(proxy);
		EIP712MetaTx.MetaTransaction memory metaTx = EIP712MetaTx.MetaTransaction({
			contractWallet: proxy,
			nonce: identityProxy.getNonce(),
			from: proxyOwner,
			value: amount,
			dappContract: destination,
			methodName: methodName,
			methodParams: methodParams,
			data: data
		});
		require(verify(proxyOwner, metaTx, r, s, v), "Signature does not match with signer");
		identityProxy.forward(destination, amount, data);
		emit Forwarded(destination, amount, data);
	}

	function withdraw(bytes32 r, bytes32 s, uint8 v, string memory message, string memory length, address proxyOwner,
	address payable receiver, uint256 amount) public {
		require(proxyManager.getProxyStatus(proxyOwner, proxyManager.getProxyAddress(proxyOwner)), "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyManager.getProxyAddress(proxyOwner)));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		require(verifySignature(r,s,v, message, length, proxyOwner, identityProxy.getNonce()), "Signature does not match with signer");
		identityProxy.withdraw(receiver, amount);
	}

	//transfer erc20 token
	function transferERC20(bytes32 r, bytes32 s, uint8 v, string memory message, string memory length, address proxyOwner,
	address erc20ContractAddress, address destination, uint256 amount) public {
		require(proxyManager.getProxyStatus(proxyOwner, proxyManager.getProxyAddress(proxyOwner)), "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyManager.getProxyAddress(proxyOwner)));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		require(verifySignature(r,s,v, message, length, proxyOwner, identityProxy.getNonce()), "Signature does not match with signer");
		identityProxy.transferERC20(erc20ContractAddress, destination, amount);
	}

	//transfer erc721 token
	function transferERC721(bytes32 r, bytes32 s, uint8 v, string memory message, string memory length,
	address proxyOwner, address erc721ContractAddress, address destination, uint256 tokenId) public {
		require(proxyManager.getProxyStatus(proxyOwner, proxyManager.getProxyAddress(proxyOwner)), "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyManager.getProxyAddress(proxyOwner)));
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
	string memory length, address owner, uint256 userNonce) public view returns (bool){
        string memory nonceStr = uint2str(userNonce);
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n",length,message,nonceStr));
		return (owner == ecrecover(hash, v, r, s));
    }

	function verify(address signer, MetaTransaction memory metaTx, bytes32 sigR, bytes32 sigS, uint8 sigV) private view returns (bool) {
		return signer == ecrecover(toTypedMessageHash(hashMetaTransaction(metaTx)), sigV, sigR, sigS);
	}
}