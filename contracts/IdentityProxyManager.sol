pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";
import "./RelayerManager.sol";

contract IdentityProxyManager is Ownable(msg.sender) {

	mapping(address => mapping(address => bool)) public proxyOwners;
	mapping(address => address) public proxyOwnerMap;
	RelayerManager relayerManager;

	// EVENTS
	event ProxyCreated(address indexed identityProxy, address indexed proxyOwner, address creator);
	event Forwarded (address indexed destination, uint amount, bytes data);
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
		emit ProxyCreated(proxyContractAddress, proxyOwner, msg.sender);
		return proxyContractAddress;
	}

	function getProxyAddress(address proxyOwner) public view returns(address) {
		address proxyAddress = proxyOwnerMap[proxyOwner];
		if(proxyOwners[proxyOwner][proxyAddress]) {
			return proxyAddress;
		}
		return address(0);
	}

	function forward(bytes memory _signature, string memory message,
	address payable proxy, address proxyOwner, address destination, uint amount, bytes memory data)
	public onlyProxyOwner(proxyOwner, proxy) onlyRelayer
	{
		IdentityProxy identityProxy = IdentityProxy(proxy);
		identityProxy.forward(_signature, message,destination, amount, data);
		emit Forwarded(destination, amount, data);
	}

	function withdraw(bytes memory _signature, string memory message, address proxyOwner,
	address payable receiver, uint256 amount) public onlyRelayer {
		require(proxyOwners[proxyOwner][proxyOwnerMap[proxyOwner]], "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyOwnerMap[proxyOwner]));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		identityProxy.withdraw(_signature, message, receiver, amount);
	}

	//transfer erc20 token
	function transferERC20(bytes memory _signature, string memory message, address proxyOwner,
	address erc20ContractAddress, address destination, uint256 amount) public onlyRelayer {
		require(proxyOwners[proxyOwner][proxyOwnerMap[proxyOwner]], "Not a Proxy owner");

		address payable proxyAddress = address(uint160(proxyOwnerMap[proxyOwner]));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		identityProxy.transferERC20(_signature, message, erc20ContractAddress, destination, amount);
	}

	//transfer erc721 token
	function transferERC721(bytes memory _signature, string memory message, address proxyOwner, address erc721ContractAddress,
	address destination, uint256 tokenId) public onlyRelayer {
		require(proxyOwners[proxyOwner][proxyOwnerMap[proxyOwner]], "Not a Proxy owner");
		address payable proxyAddress = address(uint160(proxyOwnerMap[proxyOwner]));
		IdentityProxy identityProxy = IdentityProxy(proxyAddress);
		identityProxy.transferERC721(_signature, message, erc721ContractAddress, destination, tokenId);
	}

	

}

