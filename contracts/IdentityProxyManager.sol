pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";

contract IdentityProxyManager is Ownable {

	address[] public relayers;
	mapping(address => bool) public relayerStatus;
	mapping(address => mapping(address => bool)) proxyOwners;

	// EVENTS
	event ProxyCreated(address indexed identityProxy, address indexed owner, address creator);

	// MODIFIERS
	modifier onlyRelayer() {
		require(relayerStatus[msg.sender], "You are not allowed to perform this operation");
		_;
	}

	modifier onlyProxyOwner(address proxy, address owner) {
		require(proxyOwners[proxy][owner], "You are not the owner of proxy contract");
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
		proxyOwners[address(identityProxy)][owner] = true;
		emit ProxyCreated(address(identityProxy), owner, msg.sender);
	}

	function forward(address payable proxy, address owner, address destination, uint amount, bytes memory data) 
		public onlyProxyOwner(proxy, owner) onlyRelayer 
	{
		IdentityProxy identityProxy = IdentityProxy(proxy);
		identityProxy.forward(destination, amount, data);
	}

	function withdraw(address payable proxy, address owner, address payable receiver, uint256 amount) public onlyProxyOwner(proxy, owner) onlyRelayer {
		IdentityProxy identityProxy = IdentityProxy(proxy);
		identityProxy.withdraw(receiver, amount);	
	}

	function addRelayer(address relayer) public onlyOwner {
		require(!relayerStatus[relayer]);
		relayers.push(relayer);
		relayerStatus[relayer] = true;
	}

}