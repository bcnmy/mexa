pragma solidity ^0.5.0;
import "./libs/Ownable.sol";
import "./IdentityProxy.sol";

contract ProxyManager is Ownable(msg.sender) {

    // EVENTS
    event RelayHubChanged(address currentRelayHub, address newRelayHub, address owner);
    event ProxyCreated(address indexed identityProxy, address indexed proxyOwner, address creator);

    // MODIFIERS
    modifier onlyRelayHub() {
		require(relayHub == msg.sender, "You are not allowed to perform this operation");
		_;
	}

    mapping(address => mapping(address => bool)) internal proxyOwners;
	mapping(address => address) internal proxyOwnerMap;

    address public relayHub;

    function upgradeRelayHub(address newRelahHub) public onlyOwner {
        relayHub = newRelahHub;
    }

    function addProxy(address proxyOwner, address proxyAddress) internal {
        proxyOwners[proxyOwner][proxyAddress] = true;
		proxyOwnerMap[proxyOwner] = proxyAddress;
    }

    function getProxyAddress(address proxyOwner) public view returns(address) {
        address proxyAddress = proxyOwnerMap[proxyOwner];
		if(proxyOwners[proxyOwner][proxyAddress]) {
			return proxyAddress;
		}
		return address(0);
    }

    function getProxyStatus(address proxyOwner, address proxyAddress) public view returns(bool) {
        return proxyOwners[proxyOwner][proxyAddress];
    }

    function createIdentityProxy(address proxyOwner) public onlyRelayHub {
        IdentityProxy identityProxy = new IdentityProxy(proxyOwner);
		addProxy(proxyOwner, address(identityProxy));
        emit ProxyCreated(address(identityProxy), proxyOwner, address(this));
    }

    function forward(address payable proxyAddress, address payable destination, uint256 amount,
        bytes memory data) public onlyRelayHub {
        IdentityProxy identityProxy = IdentityProxy(proxyAddress);
        identityProxy.forward(destination, amount, data);
    }

    function withdraw(address payable proxyAddress, address payable receiver, uint256 amount) public onlyRelayHub {
        IdentityProxy identityProxy = IdentityProxy(proxyAddress);
        identityProxy.withdraw(receiver, amount);
    }

    function transferERC20(address payable proxyAddress, address erc20ContractAddress,
        address destination, uint256 amount) public onlyRelayHub {
        IdentityProxy identityProxy = IdentityProxy(proxyAddress);
        identityProxy.transferERC20(erc20ContractAddress, destination, amount);
    }

    function transferERC721(address payable proxyAddress, address erc721ContractAddress,
        address destination, uint256 tokenId) public onlyRelayHub {
        IdentityProxy identityProxy = IdentityProxy(proxyAddress);
        identityProxy.transferERC721(erc721ContractAddress, destination, tokenId);
    }
}