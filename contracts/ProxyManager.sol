pragma solidity ^0.5.0;
import "./libs/Ownable.sol";

contract ProxyManager is Ownable(msg.sender){
    mapping(address => mapping(address => bool)) internal proxyOwners;
	mapping(address => address) internal proxyOwnerMap;


    function addProxy(address proxyOwner, address proxyAddress) public onlyOwner {
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

}