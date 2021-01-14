pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "./ERC20ForwardRequestCompatible.sol";
import "../libs/Ownable.sol";

/**
 *
 * @title BiconomyForwarder
 *
 * @notice A trusted forwarder for Biconomy relayed meta transactions
 *
 * @dev - Inherits the ERC20ForwarderRequest struct
 * @dev - Verifies EIP712 signatures
 * @dev - Verifies personalSign signatures
 * @dev - Implements 2D nonces... each Tx has a BatchId and a BatchNonce
 * @dev - Keeps track of highest BatchId used by a given address, to assist in encoding of transactions client-side
 * @dev - maintains a list of verified domain seperators
 *
 */
contract BiconomyForwarder is ERC20ForwardRequestTypes,Ownable{
    using ECDSA for bytes32;

    mapping(bytes32 => bool) public domains;

    string public constant EIP712_DOMAIN_TYPE = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";

    bytes32 public constant REQUEST_TYPEHASH = keccak256(bytes("ERC20ForwardRequest(address from,address to,address token,uint256 txGas,uint256 tokenGasPrice,uint256 batchId,uint256 batchNonce,uint256 deadline,bytes data)"));

    mapping(address => mapping(uint256 => uint256)) nonces;

    constructor(
        address _owner
    ) public Ownable(_owner){
        require(_owner != address(0), "Owner Address cannot be 0");
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
            id,
            address(this));

        bytes32 domainHash = keccak256(domainValue);

        domains[domainHash] = true;
        emit DomainRegistered(domainHash, domainValue);
    }

    event DomainRegistered(bytes32 indexed domainSeparator, bytes domainValue);

    /* solhint-disable-next-line no-empty-blocks */
    receive() external payable {}


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
        ERC20ForwardRequest memory req,
        bytes32 domainSeparator,
        bytes calldata sig)
    external view {
        _verifySigEIP712(req, domainSeparator, sig);
    }

    /**
     * @dev verifies the call is valid by calling _verifySigEIP712
     * @dev executes the forwarded call if valid
     * @dev updates the nonce after
     * @param req : request being executed
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executeEIP712(
        ERC20ForwardRequest memory req,
        bytes32 domainSeparator,
        bytes calldata sig
    )
    external payable
    returns (bool success, bytes memory ret) {
        _verifySigEIP712(req,domainSeparator,sig);
        _updateNonce(req);
        /* solhint-disable-next-line avoid-low-level-calls */
        (success,ret) = req.to.call{gas : req.txGas}(abi.encodePacked(req.data, req.from));
        if ( address(this).balance>0 ) {
            payable(req.from).transfer(address(this).balance);
        }
    }

    /**
     * @dev an external function which exposes the internal _verifySigPersonSign method
     * @param req : request being verified
     * @param sig : the signature generated by the user's wallet
     */
    function verifyPersonalSign(
        ERC20ForwardRequest memory req,
        bytes calldata sig)
    external view {
        _verifySigPersonalSign(req, sig);
    }

    /**
     * @dev verifies the call is valid by calling _verifySigPersonalSign
     * @dev executes the forwarded call if valid
     * @dev updates the nonce after
     * @param req : request being executed
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executePersonalSign(ERC20ForwardRequest memory req,bytes calldata sig)
    external payable
    returns(bool success, bytes memory ret){
        _verifySigPersonalSign(req, sig);
        _updateNonce(req);
        /* solhint-disable-next-line avoid-low-level-calls */
        (success,ret) = req.to.call{gas : req.txGas}(abi.encodePacked(req.data, req.from));
        if ( address(this).balance>0 ) {
            payable(req.from).transfer(address(this).balance);
        }
    }

    /**
     * @dev Increments the nonce of given user/batch pair
     * @dev Updates the highestBatchId of the given user if the request's batchId > current highest
     * @dev only intended to be called post call execution
     * @param req : request that was executed
     */
    function _updateNonce(ERC20ForwardRequest memory req) internal {
        nonces[req.from][req.batchId]++;
    }

    /**
     * @dev verifies the domain separator used has been registered via registerDomainSeparator()
     * @dev recreates the 32 byte hash signed by the user's wallet (as per EIP712 specifications)
     * @dev verifies the signature using Open Zeppelin's ECDSA library
     * @dev signature valid if call doesn't throw
     *
     * @param req : request being executed
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     *
     */
    function _verifySigEIP712(
        ERC20ForwardRequest memory req,
        bytes32 domainSeparator,
        bytes memory sig)
    internal
    view
    {
        require(req.deadline == 0 || now + 20 <= req.deadline, "request expired");
        require(domains[domainSeparator], "unregistered domain separator");
        bytes32 digest =
            keccak256(abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                keccak256(abi.encode(REQUEST_TYPEHASH,
                            req.from,
                            req.to,
                            req.token,
                            req.txGas,
                            req.tokenGasPrice,
                            req.batchId,
                            nonces[req.from][req.batchId],
                            req.deadline,
                            keccak256(req.data)
                        ))));
        require(digest.recover(sig) == req.from, "signature mismatch");
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
     * @param req : request being executed
     * @param sig : the signature generated by the user's wallet
     *
     */
    function _verifySigPersonalSign(
        ERC20ForwardRequest memory req,
        bytes memory sig)
    internal
    view
    {
        require(req.deadline == 0 || now + 20 <= req.deadline, "request expired");
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

}