// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ForwardRequestTypesV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 *
 * @title BiconomyForwarder
 *
 * @notice A trusted forwarder for Biconomy relayed meta transactions
 *
 * @dev - Inherits Forward Request structs from Forward Request Types
 * @dev - Verifies EIP712 signatures
 * @dev - Verifies traditional personalSign signatures
 * @dev - Implements 2D nonces... each Tx has a BatchId and a BatchNonce
 * @dev - Keeps track of highest BatchId used by a given address, to assist in encoding of transactions client-side
 * @dev - maintains a list of verified domain seperators
 *
 */

 //@review if experimental abiCoder is necessary for structs we need in calldata
 contract BiconomyForwarderV2Beta is ForwardRequestTypesV2, Ownable {
    using ECDSA for bytes32;

    mapping(bytes32 => bool) public domains;

    uint256 chainId;

    string public constant EIP712_DOMAIN_TYPE = "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)";

    //@review
    //Could add more type hash and rename above one if multiple executeEIP712 is planned to be supported
    bytes32 public constant REQUEST_TYPEHASH = keccak256(bytes("ForwardRequest(address from,address to,uint256 txGas,uint256 batchId,uint256 batchNonce,uint256 deadline,bytes data)"));

    //@review and rename
    bytes32 public constant FORWARD_REQUEST_TYPEHASH = keccak256(bytes("ERC20ForwardRequest(address from,address to,address token,uint256 txGas,uint256 tokenGasPrice,uint256 batchId,uint256 batchNonce,uint256 deadline,bytes data)"));

    //Sandbox use case
    bytes32 public constant CUSTOM_FORWARD_REQUEST_TYPEHASH = keccak256(bytes("CustomForwardRequest(string warning,string info,string action,ERC20ForwardRequest request)ERC20ForwardRequest(address from,address to,address token,uint256 txGas,uint256 tokenGasPrice,uint256 batchId,uint256 batchNonce,uint256 deadline,bytes data)"));

    mapping(address => mapping(uint256 => uint256)) nonces;

    constructor(
    ) public {
        uint256 id;
        assembly {
            id := chainid()
        }
        chainId = id;
    }

    /**
     * @dev registers domain seperators, maintaining that all domain seperators used for EIP712 forward requests use...
     * ... the address of this contract and the chainId of the chain this contract is deployed to
     * @param name : name of dApp/dApp fee proxy
     * @param version : version of dApp/dApp fee proxy
     */
    function registerDomainSeparator(string calldata name, string calldata version) external onlyOwner{
        uint256 id;
        /* solhint-disable-next-line no-inline-assembly */
        assembly {
            id := chainid()
        }

        bytes memory domainValue = abi.encode(
            keccak256(bytes(EIP712_DOMAIN_TYPE)),
            keccak256(bytes(name)),
            keccak256(bytes(version)),
            address(this),
            bytes32(id));

        bytes32 domainHash = keccak256(domainValue);

        domains[domainHash] = true;
        emit DomainRegistered(domainHash, domainValue);
    }

    event DomainRegistered(bytes32 indexed domainSeparator, bytes domainValue);

    event MetaTransactionExecuted(address indexed userAddress, address indexed relayerAddress, bytes indexed functionSignature);

    /**
     * @dev returns a value from the nonces 2d mapping
     * @param from : the user address
     * @param batchId : the key of the user's batch being queried
     * @return nonce : the number of transaction made within said batch
     */
    function getNonce(address from, uint256 batchId)
    public view
    returns (uint256) {
        return nonces[from][batchId];
    }

    /**
     * @dev an external function which exposes the internal _verifySigEIP712 method
     * @param req : request being verified
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     */
    function verifyEIP712(
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig)
    external view {
        _verifySigEIP712(req, domainSeparator, sig);
    }

    /**
     * @dev verifies the call is valid by calling _verifySigEIP712
     * @dev executes the forwarded call if valid
     * @dev updates the nonce after
     * @param req : ERC20 forward request being executed
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executeEIP712(
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig
    )
    external 
    returns (bool success, bytes memory ret) {
        _verifySigEIP712(req,domainSeparator,sig);
        _updateNonce(req);
        /* solhint-disable-next-line avoid-low-level-calls */
         (success,ret) = req.to.call{gas : req.txGas}(abi.encodePacked(req.data, req.from));
         // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.link/blog/ethereum-gas-dangers/
        assert(gasleft() > req.txGas / 63);
        _verifyCallResult(success,ret,"Forwarded call to destination did not succeed");
        emit MetaTransactionExecuted(req.from, msg.sender, req.data);
    }

    /**
     * @dev verifies the call is valid by calling _verifySigEIP712
     * @dev executes the forwarded call if valid
     * @dev updates the nonce after
     * @param req : Custom ERC20 forward request being executed
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executeEIP712(
        CustomForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig
    )
    external 
    returns (bool success, bytes memory ret) {
        _verifySigEIP712(req,domainSeparator,sig);
        _updateNonce(req);
        /* solhint-disable-next-line avoid-low-level-calls */
         (success,ret) = req.request.to.call{gas : req.request.txGas}(abi.encodePacked(req.request.data, req.request.from));
         // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.link/blog/ethereum-gas-dangers/
        assert(gasleft() > req.request.txGas / 63);
        _verifyCallResult(success,ret,"Forwarded call to destination did not succeed");
        emit MetaTransactionExecuted(req.request.from, msg.sender, req.request.data);
    }

    /**
     * @dev verifies the call is valid by calling _verifySigEIP712
     * @dev executes the forwarded call if valid
     * @dev updates the nonce after
     * @param req :  Regular forward request being executed for EIP2771 meta transaction
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executeEIP712(
        ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig
    )
    external 
    returns (bool success, bytes memory ret) {
        _verifySigEIP712(req,domainSeparator,sig);
        _updateNonce(req);
        /* solhint-disable-next-line avoid-low-level-calls */
         (success,ret) = req.to.call{gas : req.txGas}(abi.encodePacked(req.data, req.from));
         // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.link/blog/ethereum-gas-dangers/
        assert(gasleft() > req.txGas / 63);
        _verifyCallResult(success,ret,"Forwarded call to destination did not succeed");
        emit MetaTransactionExecuted(req.from, msg.sender, req.data);
    }

    /**
     * @dev an external function which exposes the internal _verifySigPersonSign method
     * @param req : request being verified
     * @param sig : the signature generated by the user's wallet
     */
    function verifyPersonalSign(
        ERC20ForwardRequest calldata req,
        bytes calldata sig)
    external view {
        _verifySigPersonalSign(req, sig);
    }

    /**
     * @dev verifies the call is valid by calling _verifySigPersonalSign
     * @dev executes the forwarded call if valid
     * @dev updates the nonce after
     * @param req : ERC20 forward request being executed
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executePersonalSign(ERC20ForwardRequest calldata req,bytes calldata sig)
    external 
    returns(bool success, bytes memory ret){
        _verifySigPersonalSign(req, sig);
        _updateNonce(req);
        (success,ret) = req.to.call{gas : req.txGas}(abi.encodePacked(req.data, req.from));
        // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.link/blog/ethereum-gas-dangers/
        assert(gasleft() > req.txGas / 63);
        _verifyCallResult(success,ret,"Forwarded call to destination did not succeed");
        emit MetaTransactionExecuted(req.from, msg.sender, req.data);
    }

    /**
     * @dev verifies the call is valid by calling _verifySigPersonalSign
     * @dev executes the forwarded call if valid
     * @dev updates the nonce after
     * @param req : Regular forward request being executed for EIP2771 meta transaction
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executePersonalSign(ForwardRequest calldata req,bytes calldata sig)
    external 
    returns(bool success, bytes memory ret){
        _verifySigPersonalSign(req, sig);
        _updateNonce(req);
        (success,ret) = req.to.call{gas : req.txGas}(abi.encodePacked(req.data, req.from));
        // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.link/blog/ethereum-gas-dangers/
        assert(gasleft() > req.txGas / 63);
        _verifyCallResult(success,ret,"Forwarded call to destination did not succeed");
        emit MetaTransactionExecuted(req.from, msg.sender, req.data);
    }

    /**
     * @dev Increments the nonce of given user/batch pair
     * @dev Updates the highestBatchId of the given user if the request's batchId > current highest
     * @dev only intended to be called post call execution
     * @param req : ERC20 forward request that was executed
     */
    function _updateNonce(ERC20ForwardRequest calldata req) internal {
        nonces[req.from][req.batchId]++;
    }
    
    /**
     * @dev Increments the nonce of given user/batch pair
     * @dev Updates the highestBatchId of the given user if the request's batchId > current highest
     * @dev only intended to be called post call execution
     * @param req : ERC20 custom forward request that was executed
     */
    function _updateNonce(CustomForwardRequest calldata req) internal {
        nonces[req.request.from][req.request.batchId]++;
    }


    /**
     * @dev Increments the nonce of given user/batch pair
     * @dev Updates the highestBatchId of the given user if the request's batchId > current highest
     * @dev only intended to be called post call execution
     * @param req : regular forward request that was executed for EIP2771 meta transaction
     */
    function _updateNonce(ForwardRequest calldata req) internal {
        nonces[req.from][req.batchId]++;
    }

    /**
     * @dev verifies the domain separator used has been registered via registerDomainSeparator()
     * @dev recreates the 32 byte hash signed by the user's wallet (as per EIP712 specifications)
     * @dev verifies the signature using Open Zeppelin's ECDSA library
     * @dev signature valid if call doesn't throw
     *
     * @param req : ERC20 forward request being executed
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     *
     */
    function _verifySigEIP712(
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes memory sig)
    internal
    view
    {   
        uint256 id;
        /* solhint-disable-next-line no-inline-assembly */
        assembly {
            id := chainid()
        }
        require(req.deadline == 0 || block.timestamp + 20 <= req.deadline, "request expired");
        require(domains[domainSeparator], "unregistered domain separator");
        require(chainId == id, "potential replay attack on the fork");
        bytes32 digest =
            keccak256(abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                hashERC20ForwardRequest(req)
            ));
        require(digest.recover(sig) == req.from, "signature mismatch");
    }

    /**
     * @dev verifies the domain separator used has been registered via registerDomainSeparator()
     * @dev recreates the 32 byte hash signed by the user's wallet (as per EIP712 specifications)
     * @dev verifies the signature using Open Zeppelin's ECDSA library
     * @dev signature valid if call doesn't throw
     *
     * @param req : Custom ERC20 forward request being executed
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     *
     */
    function _verifySigEIP712(
        CustomForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes memory sig)
    internal
    view
    {   
        uint256 id;
        /* solhint-disable-next-line no-inline-assembly */
        assembly {
            id := chainid()
        }
        require(req.request.deadline == 0 || block.timestamp + 20 <= req.request.deadline, "request expired");
        require(domains[domainSeparator], "unregistered domain separator");
        require(chainId == id, "potential replay attack on the fork");
        bytes32 digest =
            keccak256(abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                hashCustomForwardRequest(req)
            ));
        require(digest.recover(sig) == req.request.from, "signature mismatch");
    }

    /**
     * @dev verifies the domain separator used has been registered via registerDomainSeparator()
     * @dev recreates the 32 byte hash signed by the user's wallet (as per EIP712 specifications)
     * @dev verifies the signature using Open Zeppelin's ECDSA library
     * @dev signature valid if call doesn't throw
     *
     * @param req : Regular forward request being executed for EIP2771 meta transaction
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     *
     */
    function _verifySigEIP712(
        ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes memory sig)
    internal
    view
    {   
        uint256 id;
        /* solhint-disable-next-line no-inline-assembly */
        assembly {
            id := chainid()
        }
        require(req.deadline == 0 || block.timestamp + 20 <= req.deadline, "request expired");
        require(domains[domainSeparator], "unregistered domain separator");
        require(chainId == id, "potential replay attack on the fork");
        bytes32 digest =
            keccak256(abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                hashForwardRequest(req)
            ));
        require(digest.recover(sig) == req.from, "signature mismatch");
    }
    

    function hashERC20ForwardRequest(ERC20ForwardRequest calldata request) internal view returns (bytes32) {
        return keccak256(abi.encode(
            FORWARD_REQUEST_TYPEHASH,
            request.from,
            request.to,
            request.token,
            request.txGas,
            request.tokenGasPrice,
            request.batchId,
            nonces[request.from][request.batchId],
            request.deadline,
            keccak256(request.data)
        ));
    }

    function hashForwardRequest(ForwardRequest calldata request) internal view returns (bytes32) {
        return keccak256(abi.encode(
            REQUEST_TYPEHASH,
            request.from,
            request.to,
            request.txGas,
            request.batchId,
            nonces[request.from][request.batchId],
            request.deadline,
            keccak256(request.data)
        ));
    }

    function hashCustomForwardRequest(CustomForwardRequest calldata req) internal view returns (bytes32) {
        return keccak256(abi.encode(
            CUSTOM_FORWARD_REQUEST_TYPEHASH,
            keccak256(bytes(req.warning)),
            keccak256(bytes(req.info)),
            keccak256(bytes(req.action)),
            hashERC20ForwardRequest(req.request) 
        ));
    }

    /**
     * @dev encodes a 32 byte data string (presumably a hash of encoded data) as per eth_sign
     *
     * @param hash : hash of encoded data that signed by user's wallet using eth_sign
     * @return input hash encoded to matched what is signed by the user's key when using eth_sign*/
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    /**
     * @dev recreates the 32 byte hash signed by the user's wallet
     * @dev verifies the signature using Open Zeppelin's ECDSA library
     * @dev signature valid if call doesn't throw
     *
     * @param req : ERC20 forward request being executed
     * @param sig : the signature generated by the user's wallet
     *
     */
    function _verifySigPersonalSign(
        ERC20ForwardRequest calldata req,
        bytes memory sig)
    internal
    view
    {
        require(req.deadline == 0 || block.timestamp + 20 <= req.deadline, "request expired");
        bytes32 digest = prefixed(keccak256(abi.encodePacked(
            req.from,
            req.to,
            req.token,
            req.txGas,
            req.tokenGasPrice,
            req.batchId,
            nonces[req.from][req.batchId],
            req.deadline,
            keccak256(req.data)
        )));
        require(digest.recover(sig) == req.from, "signature mismatch");
    }

    /**
     * @dev recreates the 32 byte hash signed by the user's wallet
     * @dev verifies the signature using Open Zeppelin's ECDSA library
     * @dev signature valid if call doesn't throw
     *
     * @param req : Regular forward request being executed for EIP2771 meta transaction
     * @param sig : the signature generated by the user's wallet
     *
     */
    function _verifySigPersonalSign(
        ForwardRequest calldata req,
        bytes memory sig)
    internal
    view
    {
        require(req.deadline == 0 || block.timestamp + 20 <= req.deadline, "request expired");
        bytes32 digest = prefixed(keccak256(abi.encodePacked(
            req.from,
            req.to,
            req.txGas,
            req.batchId,
            nonces[req.from][req.batchId],
            req.deadline,
            keccak256(req.data)
        )));
        require(digest.recover(sig) == req.from, "signature mismatch");
    }

    /**
     * @dev verifies the call result and bubbles up revert reason for failed calls
     *
     * @param success : outcome of forwarded call
     * @param returndata : returned data from the frowarded call
     * @param errorMessage : fallback error message to show 
     */
     function _verifyCallResult(bool success, bytes memory returndata, string memory errorMessage) private pure {
        if (!success) {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                // solhint-disable-next-line no-inline-assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }

}