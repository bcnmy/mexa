pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";

contract IdentityProxyManager is Ownable(msg.sender) {

	address[] public relayers;
	mapping(address => bool) public relayerStatus;
	mapping(address => mapping(address => bool)) public proxyOwners;
	mapping(address => address) public proxyOwnerMap;

	// EVENTS
	event ProxyCreated(address indexed identityProxy, address indexed proxyOwner, address creator);
	event Forwarded (address indexed destination, uint amount, bytes data);
	event RelayerAdded(address relayer, address owner);
	event ProxyOwnerAdded(address indexed proxy, address currentOwner, address newOwner);

	// MODIFIERS
	modifier onlyRelayer() {
		require(relayerStatus[msg.sender], "You are not allowed to perform this operation");
		_;
	}

	modifier onlyProxyOwner(address proxyOwner, address proxy) {
		require(proxyOwners[proxyOwner][proxy], "You are not the owner of proxy contract");
		_;
	}

	function getRelayerStatus(address relayer) public view returns(bool status) {
		status = relayerStatus[relayer];
	}

	function getAllRelayers() public view returns(address[] memory) {
		return relayers;
	}

	function createIdentityProxy(address proxyOwner) public onlyRelayer returns(address) {
		IdentityProxy identityProxy = new IdentityProxy(proxyOwner);
		proxyOwners[proxyOwner][address(identityProxy)] = true;
		proxyOwnerMap[proxyOwner] = address(identityProxy);
		emit ProxyCreated(address(identityProxy), proxyOwner, msg.sender);
		return address(identityProxy);
	}

	function getProxyAddress(address proxyOwner) public view returns(address) {
		address proxyAddress = proxyOwnerMap[proxyOwner];
		if(proxyOwners[proxyOwner][proxyAddress]) {
			return proxyAddress;
		}
		return address(0);
	}

	function forward(address payable proxy, address proxyOwner, address destination, uint amount, bytes memory data)
		public onlyProxyOwner(proxyOwner, proxy) onlyRelayer
	{
		IdentityProxy identityProxy = IdentityProxy(proxy);
		identityProxy.forward(destination, amount, data);
		emit Forwarded(destination, amount, data);
	}

	function withdraw(bytes memory _signature, string memory message, address proxyOwner, address payable receiver, uint256 amount) public onlyRelayer {
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

	//Register new Relayer
	function addRelayers(address[] memory relayerArray) public onlyOwner {
		for(uint i = 0; i<relayerArray.length; i++) {
			require(relayerArray[i] != address(0), 'Relayer address cannot be zero');
			relayers.push(relayerArray[i]);
			relayerStatus[relayerArray[i]] = true;
			emit RelayerAdded(relayerArray[i], msg.sender);
		}
	}

}

