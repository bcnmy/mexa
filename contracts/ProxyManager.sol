pragma solidity ^0.5.0;
import "./libs/Ownable.sol";
import "./IdentityProxy.sol";

contract ProxyManager is Ownable(msg.sender) {
    // EVENTS
    event RelayHubChanged(
        address currentRelayHub,
        address newRelayHub,
        address owner
    );
    event ProxyCreated(
        address indexed identityProxy,
        address indexed proxyOwner,
        address creator
    );

    // MODIFIERS
    modifier onlyRelayHub() {
        require(
            relayHub == msg.sender,
            "You are not allowed to perform this operation"
        );
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

    function getProxyAddress(address proxyOwner) public view returns (address) {
        address proxyAddress = proxyOwnerMap[proxyOwner];
        if (proxyOwners[proxyOwner][proxyAddress]) {
            return proxyAddress;
        }
        return address(0);
    }

    function getProxyStatus(address proxyOwner, address proxyAddress)
        public
        view
        returns (bool)
    {
        return proxyOwners[proxyOwner][proxyAddress];
    }

    function createIdentityProxy(address proxyOwner) public onlyRelayHub {
        IdentityProxy identityProxy = new IdentityProxy(proxyOwner);
        addProxy(proxyOwner, address(identityProxy));
        emit ProxyCreated(address(identityProxy), proxyOwner, address(this));
    }

    function() external {
        bytes20 relayerAddress;
        address impl;

        assembly {
            calldatacopy(0x40, sub(calldatasize, 20), calldatasize)
            relayerAddress := mload(0x40)
        }
        impl = address(uint160(relayerAddress));
        assembly {
            let ptr := add(0x40, 20)
            calldatacopy(ptr, 0, sub(calldatasize, 20))
            let result := call(gas, impl, 0, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            switch result
                case 0 {
                    revert(ptr, size)
                }
                default {
                    return(ptr, size)
                }

        }

    }
}
