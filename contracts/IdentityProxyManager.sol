pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";

contract IdentityProxyManager is Ownable {

	address[] public relayers;
	mapping(address => bool) public relayerStatus;
	mapping(address => mapping(address => bool)) public proxyOwners;
	mapping(address => address) public proxyOwnerMap;

	// EVENTS
	event ProxyCreated(address indexed identityProxy, address indexed owner, address creator);
	event Forwarded (address indexed destination, uint amount, bytes data);
	event RelayerAdded(address relayer, address owner);
	event ProxyOwnerAdded(address indexed proxy, address currentOwner, address newOwner);

	// MODIFIERS
	modifier onlyRelayer() {
		require(relayerStatus[msg.sender], "You are not allowed to perform this operation");
		_;
	}

	modifier onlyProxyOwner(address owner, address proxy) {
		require(proxyOwners[owner][proxy], "You are not the owner of proxy contract");
		_;
	}

	constructor(address relayer) public {
		relayers.push(relayer);
		relayerStatus[relayer] = true;
	}

	function getRelayerStatus(address relayer) public view returns(bool status) {
		status = relayerStatus[relayer];
	}

	function getAllRelayers() public view returns(address[] memory) {
		return relayers;
	}

	function createIdentityProxy(address owner) public onlyRelayer {
		IdentityProxy identityProxy = new IdentityProxy();
		proxyOwners[owner][address(identityProxy)] = true;
		proxyOwnerMap[owner] = address(identityProxy);
		emit ProxyCreated(address(identityProxy), owner, msg.sender);
	}

	function getProxyAddress(address owner) public view returns(address) {
		address proxyAddress = proxyOwnerMap[owner];
		if(proxyOwners[owner][proxyAddress]) {
			return proxyAddress;
		}
		return address(0);
	}

	function forward(address payable proxy, address owner, address destination, uint amount, bytes memory data) 
		public onlyProxyOwner(owner, proxy) onlyRelayer 
	{
		IdentityProxy identityProxy = IdentityProxy(proxy);
		identityProxy.forward(destination, amount, data);
		emit Forwarded(destination, amount, data);
	}

	function withdraw(address payable proxy, address owner, address payable receiver, uint256 amount) public onlyProxyOwner(owner, proxy) onlyRelayer {
		IdentityProxy identityProxy = IdentityProxy(proxy);
		identityProxy.withdraw(receiver, amount);	
	}

	function addRelayer(address relayer) public onlyOwner {
		require(!relayerStatus[relayer]);
		relayers.push(relayer);
		relayerStatus[relayer] = true;
		emit RelayerAdded(relayer, msg.sender);
	}

	function addProxyOwner(address payable proxy, address currentOwner, address newOwner) public onlyProxyOwner(currentOwner, proxy) onlyRelayer {
		proxyOwners[newOwner][proxy] = true;
		proxyOwnerMap[newOwner] = proxy;
		emit ProxyOwnerAdded(proxy, currentOwner, newOwner);
	}

}