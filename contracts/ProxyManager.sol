pragma solidity ^0.6.2;
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
    address[] internal users;

    address public relayHub;
    address public implementation;

    constructor(address _implementation) public {
        implementation = _implementation;
    }

    // add appropriate modifier here
    function updateImplementation(address _newImplementation)
        external
        onlyOwner
    {
        require(
            _newImplementation != address(0),
            "Implementation address can not be zero"
        );
        implementation = _newImplementation;
    }
    function upgradeRelayHub(address newRelayHub) public onlyOwner {
        require(newRelayHub != address(0), "RelayHub address can not be zero");
        relayHub = newRelayHub;
    }

    function getUsers() public view returns (address[] memory) {
        return users;
    }

    function addProxy(address proxyOwner, address proxyAddress)
        public
        onlyOwner
    {
        require(
            proxyOwner != address(0),
            "Proxy Owner address can not be zero"
        );
        require(proxyAddress != address(0), "Proxy address can not be zero");
        _addProxy(proxyOwner, proxyAddress);
    }

    function _addProxy(address proxyOwner, address proxyAddress) internal {
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
        require(
            proxyOwner != address(0),
            "Proxy Owner Address can not be zero"
        );
        IdentityProxy identityProxy = new IdentityProxy(
            proxyOwner,
            implementation
        );
        _addProxy(proxyOwner, address(identityProxy));
        users.push(proxyOwner);
        emit ProxyCreated(address(identityProxy), proxyOwner, address(this));
    }

    fallback() external {
        bytes20 userWalletAddress;
        address usr;
        require(
            relayHub == msg.sender,
            "You are not allowed to perform this operation"
        );
        assembly {
            calldatacopy(0x40, sub(calldatasize(), 20), calldatasize())
            userWalletAddress := mload(0x40)
        }
        usr = address(uint160(userWalletAddress));
        assembly {
            let ptr := add(0x40, 20)
            calldatacopy(ptr, 0, sub(calldatasize(), 20))
            let result := call(gas(), usr, 0, ptr, calldatasize(), 0, 0)
            let size := returndatasize()
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
