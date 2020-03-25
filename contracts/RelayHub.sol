pragma solidity ^0.5.0;
import "./IdentityProxy.sol";
import "./libs/Ownable.sol";
import "./RelayerManager.sol";
import "./ProxyManager.sol";
import "./libs/SafeMath.sol";

contract RelayHub is
    Ownable(msg.sender),
    EIP712MetaTx("Biconomy Meta Transaction", "1")
{
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

<<<<<<< HEAD
    /**
	 * @dev Forward the transaction to user contract wallet/proxy contract.
	 * addressArray[0] user address
	 * addressArray[1] destination contract address
	 * addressArray[2] user contract wallet address
	 * addressArray[3] relayer payment address
	 * uintArray[0] expiry time of meta transaction
	 * uintArray[1] gas limit to be used in meta transaction
	 * uintArray[2] base gas required, logic is not implemented now
	 * uintArray[3] value to be transfered in transaction
	 * uintArray[4] batchId for which to get the nonce
	 * uintArray[5] relayer payment amount
	 *
	 * @param r r part of the signature
	 * @param s s part of the signature
	 * @param v v part of the signature
	 * @param addressArray array of all param of address type
	 * @param uintArray array of all param of uint256 type
	 * @param data data to be executed in meta transaction
	 */
    function forward(
        address[] memory addressArray,
        bytes memory data,
        uint256[] memory uintArray,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) public onlyProxyOwner(addressArray[0], addressArray[2]) onlyRelayer {
        if (uintArray[0] > 0 && block.number > uintArray[0]) {
            revert("Transaction can not be executed after expiry time");
        }
        require(
            verifyMetaTxSignature(addressArray, data, uintArray, v, r, s),
            "Signature does not match with signer"
        );
        // addressArray[2] => user contract wallet address
        address payable proxyAddress = address(uint160(addressArray[2]));
        address payable destinationAddress = address(uint160(addressArray[1]));
        bytes memory functionSignature = abi.encodeWithSignature(
            "forward(address,uint256,bytes,uint256,uint256)",
            destinationAddress,
            uintArray[3],
            data,
            uintArray[1],
            uintArray[4]
        );
        (bool success, bytes memory returnData) = address(proxyManager).call(
            abi.encodePacked(functionSignature, proxyAddress)
        );
        require(success, "Call to Proxy Manager Failed at Relay Hub");
        emit Forwarded(addressArray[1], uintArray[3], data);
    }

    /**
	 * @dev Withdraw funds from user contract wallet.
	 *
	 * addressArray[0] user address
	 * addressArray[1] destination contract address
	 * addressArray[2] user contract wallet address
	 * addressArray[3] relayer payment address
	 * uintArray[0] expiry time of meta transaction
	 * uintArray[1] gas limit to be used in meta transaction
	 * uintArray[2] base gas required, logic is not implemented now
	 * uintArray[3] value to be transfered in transaction
	 * uintArray[4] batchId for which to get the nonce
	 * uintArray[5] relayer payment amount
	 *
	 * @param r r part of the signature
	 * @param s s part of the signature
	 * @param v v part of the signature
	 * @param addressArray array of all param of address type
	 * @param uintArray array of all param of uint256 type
	 * @param data data to be executed in meta transaction
	 **/
    function withdraw(
        address[] memory addressArray,
        bytes memory data,
        uint256[] memory uintArray,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) public onlyProxyOwner(addressArray[0], addressArray[2]) {
        if (uintArray[0] > 0 && block.number > uintArray[0]) {
            revert("Transaction could not be executed before expiry time");
        }
        address payable proxyAddress = address(uint160(addressArray[2]));
        require(
            verifyMetaTxSignature(addressArray, data, uintArray, v, r, s),
            "Signature does not match with signer"
        );
        address payable receiverAddress = address(uint160(addressArray[1]));
        bytes memory functionSignature = abi.encodeWithSignature(
            "withdraw(address,uint256,uint256)",
            receiverAddress,
            uintArray[3],
            uintArray[4]
=======
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
>>>>>>> 2f9237558fb3f6f633487d401f74e75aea47ffa0
        );
        (bool success, bytes memory returnData) = address(proxyManager).call(
            abi.encodePacked(functionSignature, proxyAddress)
        );
        require(success, "Call to Proxy Manager Failed at Relay Hub");
    }

<<<<<<< HEAD
    /**
	 * @dev Verify EIP712 signature.
	 *
	 * addressArray[0] user address
	 * addressArray[1] destination contract address
	 * addressArray[2] user contract wallet address
	 * addressArray[3] relayer payment address
	 * string methodName | method name to be executed via meta transaction
	 * string methodParams | method params to be verified in signature
	 * uintArray[0] expiry time of meta transaction
	 * uintArray[1] gas limit to be used in meta transaction
	 * uintArray[2] base gas required, logic is not implemented now
	 * uintArray[3] value to be transfered in transaction
	 * uintArray[4] batchId for which to get the nonce
	 * uintArray[5] relayer payment amount

	 * @param r r part of the signature
	 * @param s s part of the signature
	 * @param v v part of the signature
	 * @param addressArray array of all param of address type
	 * @param uintArray array of all param of uint256 type
	 **/
    function verifyMetaTxSignature(
        address[] memory addressArray,
        bytes memory data,
        uint256[] memory uintArray,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public view returns (bool) {
        address payable proxyAddress = address(
            uint160(proxyManager.getProxyAddress(addressArray[0]))
        );
        IdentityProxy identityProxy = IdentityProxy(proxyAddress);
        EIP712MetaTx.MetaInfo memory metaInfo = EIP712MetaTx.MetaInfo({
            contractWallet: addressArray[2]
        });
        EIP712MetaTx.RelayerPayment memory relayerPayment = EIP712MetaTx
            .RelayerPayment({token: addressArray[3], amount: uintArray[5]});
        EIP712MetaTx.MetaTransaction memory metaTx = EIP712MetaTx
            .MetaTransaction({
            from: addressArray[0],
            to: addressArray[1],
            data: data,
            batchId: uintArray[4],
            nonce: identityProxy.getNonce(uintArray[4]),
            expiry: uintArray[0],
            txGas: uintArray[1],
            baseGas: uintArray[2],
            value: uintArray[3],
            metaInfo: metaInfo,
            relayerPayment: relayerPayment
        });
        return verify(addressArray[0], metaTx, v, r, s);
    }

    function verify(
        address signer,
        MetaTransaction memory metaTx,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS
    ) private view returns (bool) {
        return
            signer ==
            ecrecover(
                toTypedMessageHash(hashMetaTransaction(metaTx)),
                sigV,
                sigR,
                sigS
            );
=======
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
>>>>>>> 2f9237558fb3f6f633487d401f74e75aea47ffa0
    }
}
