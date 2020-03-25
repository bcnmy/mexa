pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";
import "./RelayerManager.sol";
import "./ProxyManager.sol";
import "./libs/SafeMath.sol";

contract RelayHub is Ownable(msg.sender) {
    using SafeMath for uint256;
    RelayerManager relayerManager;
    ProxyManager proxyManager;

    // EVENTS
    event ProxyAdded(
        address indexed identityProxy,
        address indexed proxyOwner,
        address creator
    );
    event Forwarded(address indexed destination, uint256 amount, bytes data);
    // event RelayerAdded(address relayer, address owner);
    event ProxyOwnerAdded(
        address indexed proxy,
        address currentOwner,
        address newOwner
    );

    // MODIFIERS
    modifier onlyRelayer() {
        require(
            relayerManager.getRelayerStatus(msg.sender),
            "You are not allowed to perform this operation"
        );
        _;
    }

    modifier onlyProxyOwner(address proxyOwner, address proxy) {
        require(
            proxyManager.getProxyStatus(proxyOwner, proxy),
            "You are not the owner of proxy contract"
        );
        _;
    }

    constructor(address relayerManagerAddress, address proxyManagerAddress)
        public
    {
        require(
            relayerManagerAddress != address(0),
            "Manager address can not be 0"
        );
        relayerManager = RelayerManager(relayerManagerAddress);
        proxyManager = ProxyManager(proxyManagerAddress);
    }

    function addRelayerManager(address relayerManagerAddress) public onlyOwner {
        require(
            relayerManagerAddress != address(0),
            "Manager address can not be 0"
        );
        relayerManager = RelayerManager(relayerManagerAddress);
    }

    function addProxyManager(address proxyManagerAddress) public onlyOwner {
        require(
            proxyManagerAddress != address(0),
            "Proxy manager address can not be 0"
        );
        proxyManager = ProxyManager(proxyManagerAddress);
    }

    function getRelayerManager()
        public
        view
        returns (address relayerManagerAddress)
    {
        relayerManagerAddress = address(relayerManager);
    }

    function getProxyManager()
        public
        view
        returns (address proxyManagerAddress)
    {
        proxyManagerAddress = address(proxyManager);
    }

    function createIdentityProxy(address proxyOwner) public onlyRelayer {
        proxyManager.createIdentityProxy(proxyOwner);
    }

    function getProxyAddress(address proxyOwner) public view returns (address) {
        return proxyManager.getProxyAddress(proxyOwner);
    }

    function forward(
        bytes32 r,
        bytes32 s,
        uint8 v,
        string memory message,
        string memory length,
        address payable proxy,
        address proxyOwner,
        address payable destination,
        uint256 amount,
        bytes memory data
    ) public onlyProxyOwner(proxyOwner, proxy) onlyRelayer {
        IdentityProxy identityProxy = IdentityProxy(proxy);
        require(
            verifySignature(
                r,
                s,
                v,
                message,
                length,
                proxyOwner,
                identityProxy.getNonce()
            ),
            "Signature does not match with signer"
        );
        bytes memory functionSignature = abi.encodeWithSignature(
            "forward(address,uint256,bytes)",
            destination,
            amount,
            data
        );
        (bool success, bytes memory returnData) = address(proxyManager).call(
            abi.encodePacked(functionSignature, proxy)
        );
        require(success, "Call to Proxy Manager Failed at Relay Hub");
        emit Forwarded(destination, amount, data);

    }

    function withdraw(
        bytes32 r,
        bytes32 s,
        uint8 v,
        string memory message,
        string memory length,
        address proxyOwner,
        address payable receiver,
        uint256 amount
    ) public {
        require(
            proxyManager.getProxyStatus(
                proxyOwner,
                proxyManager.getProxyAddress(proxyOwner)
            ),
            "Not a Proxy owner"
        );
        address payable proxyAddress = address(
            uint160(proxyManager.getProxyAddress(proxyOwner))
        );
        IdentityProxy identityProxy = IdentityProxy(proxyAddress);
        require(
            verifySignature(
                r,
                s,
                v,
                message,
                length,
                proxyOwner,
                identityProxy.getNonce()
            ),
            "Signature does not match with signer"
        );
        bytes memory functionSignature = abi.encodeWithSignature(
            "withdraw(address,uint256)",
            receiver,
            amount
        );
        (bool success, bytes memory returnData) = address(proxyManager).call(
            abi.encodePacked(functionSignature, proxyAddress)
        );
        require(success, "Call to Proxy Manager Failed at Relay Hub");
    }

    function uint2str(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        uint256 temp = _i;
        while (temp != 0) {
            bstr[k--] = bytes1(uint8(48 + (temp % 10)));
            temp /= 10;
        }
        return string(bstr);
    }

    function verifySignature(
        bytes32 r,
        bytes32 s,
        uint8 v,
        string memory message,
        string memory length,
        address owner,
        uint256 userNonce
    ) public view returns (bool) {
        string memory nonceStr = uint2str(userNonce);
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                length,
                message,
                nonceStr
            )
        );
        return (owner == ecrecover(hash, v, r, s));
    }
}
