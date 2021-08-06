// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../libs/EIP712MetaTransaction.sol";
import "../libs/Ownable.sol";
import "../interfaces/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TransferHandlerCustom is EIP712MetaTransaction("ERC20Transfer","1"), Ownable{
    using SafeMath for uint256;

    address public feeReceiver;

    uint16 public feeMultiplier;

    uint16 public immutable maximumMarkup=25000;

    mapping(address => mapping(uint256 => uint256)) private transferNonces;

    bytes32 public constant REQUEST_TYPEHASH = keccak256(bytes("TokenTransferRequest(uint256 batchId,uint256 batchNonce,address from,uint256 tokenGasPrice,address token,address to,uint256 value)"));

    struct PermitRequest {
        address holder; 
        address spender;  
        uint256 value;
        uint256 nonce;
        uint256 expiry;
        bool allowed; 
        uint8 v;
        bytes32 r; 
        bytes32 s; 
    }

    struct TokenTransferRequest {
        uint256 batchId;
        uint256 batchNonce;
        address from; 
        uint256 tokenGasPrice;
        address token;
        address to;
        uint256 value;
    }

    //transaction base gas
    uint128 public baseGas=21000;

    //transfer handler gas
    //very predictable
    mapping(address=>uint256) public transferHandlerGas;

    constructor(address _owner) public Ownable(_owner){
    }

    function setDefaultFeeMultiplier(uint16 _bp) external onlyOwner{
        require(_bp <= maximumMarkup, "fee multiplier is too high");
        feeMultiplier = _bp;
    }

    function setFeeReceiver(address _feeReceiver) external onlyOwner{
        require(
            _feeReceiver != address(0),
            "Transfer Handler: new fee receiver can not be a zero address"
        );
        feeReceiver = _feeReceiver;
    }

    function setTransferHandlerGas(address token, uint256 _transferHandlerGas) external onlyOwner{
        require(
            token != address(0),
            "token cannot be zero"
       );
        transferHandlerGas[token] = _transferHandlerGas;
        emit TransferHandlerGasChanged(token,msg.sender,_transferHandlerGas);
    }

    function setBaseGas(uint128 gas) external onlyOwner{
        baseGas = gas;
        emit BaseGasChanged(baseGas,msg.sender);
    }

    function getTransferNonce(address user,uint256 batchId) external view returns(uint256 nonce) {
        nonce = transferNonces[user][batchId];
    }

    // Designed to enable capturing token fees charged during the execution
    event FeeCharged(address indexed from, uint256 indexed charge, address indexed token);

    event BaseGasChanged(uint128 newBaseGas, address indexed actor);

    event FeeReceiverChanged(address newFeeReceiver, address indexed actor);

    event TransferHandlerGasChanged(address indexed tokenAddress, address indexed actor, uint256 indexed newGas);

    /* Need to verify tokenGasPrice in SDK and/or backend
       by decoding from functionSignature from executeMetaTransaction paramters.
       Another way to do this could be within contract using tx.gasprice and builtIn oracle aggregator
    */

    /**
     * @dev
     * - Keeps track of gas consumed
     * - Transfers ERC20 token to intended recipient
     * - Calls _feeTransferHandler, supplying the gas usage of the trasfer call
    **/
    /**
     * @param tokenGasPrice : gas price in context of ERC20 token being used to pay fees
     * @param token : address of token contract being transferred and used to pay fees
     * @param to : recipient address
     * @param value : amount of token transferred to recipient
     */
    function transfer(uint256 tokenGasPrice, address token, address to, uint256 value) external{
        uint256 initialGas = gasleft();
        // needs safe transfer from to support USDT
        SafeERC20.safeTransferFrom(IERC20(token), msgSender(),to,value);
        //require(IERC20(token).transferFrom(msgSender(),to,value));
        uint256 postGas = gasleft();
        uint256 charge = _feeTransferHandler(tokenGasPrice,msgSender(),token,initialGas.add(baseGas).add(transferHandlerGas[token]).sub(postGas));
        emit FeeCharged(msgSender(),charge,token);
    }

    /**
     * @dev
     * - Keeps track of gas consumed
     * - obtains permit to spend tokens worth permitOptions.value amount 
     * - Transfers ERC20 token to intended recipient
     * - Calls _feeTransferHandler, supplying the gas usage of the trasfer call
     * @notice
     * can be directly called without having to go through executeMetaTransaction for signature verification. As holder signature will be verified during permit 
    **/
    /**
     * @param req : The request being processed
     * @param sigR : User signature
     * @param sigS : User signature
     * @param sigV : User signature
     * @param permitOptions : the permit request options for executing permit. Since it is EIP2612 permit pass permitOptions.allowed = true/false for this struct. 
     */
    //review for replay protections
    function permitEIP2612AndTransfer(TokenTransferRequest calldata req, bytes32 sigR, bytes32 sigS, uint8 sigV, PermitRequest calldata permitOptions) external{
        uint256 initialGas = gasleft();
        //USDC or any EIP2612 permit
        IERC20Permit(req.token).permit(permitOptions.holder, address(this), permitOptions.value, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
        //Must verify signature for sent request
        require(verifySignature(permitOptions.holder, req, sigR, sigS, sigV), "Signer and signature do not match");
        transferNonces[permitOptions.holder][req.batchId] = transferNonces[permitOptions.holder][req.batchId].add(1); //req.from
        require(IERC20(req.token).transferFrom(permitOptions.holder,req.to,req.value));
        uint256 postGas = gasleft();
        uint256 transferHandlerGas = transferHandlerGas[req.token];
        uint256 charge = _feeTransferHandler(req.tokenGasPrice,permitOptions.holder,req.token,initialGas.add(baseGas).add(transferHandlerGas).sub(postGas));
        emit FeeCharged(permitOptions.holder,charge,req.token);
    }

    /**
     *@dev verifies the signature sent for token transfer request against the authorizer of permit
     */
    function verifySignature(address user, TokenTransferRequest memory req, bytes32 sigR, bytes32 sigS, uint8 sigV) internal view returns (bool) {
        bytes32 digest =
            keccak256(abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                keccak256(abi.encode(REQUEST_TYPEHASH,
                                     req.batchId,
                                     transferNonces[req.from][req.batchId],
                                     req.from,
                                     req.tokenGasPrice,
                                     req.token,
                                     req.to,
                                     req.value))
        ));

        address signer =  ecrecover(digest, sigV, sigR, sigS);
        require(signer != address(0), "Invalid signature");
        return signer == user;
    }

    /**
     * @dev
     * - Charges fees in ERC20 token based on executionGas supplied
     * - looks for feeMultiplier 
     * - looks for feeREceiver and transfers fees to it
     * @notice we are assuming fees will be paid in the same token being transferred and token gas price will be expected for the same. 
    **/
    /**
     * @param tokenGasPrice : gas price in context of ERC20 token being used to pay fees
     * @param _payer : address of the user paying fees in ERC20 tokens
     * @param token : token contract address used as a fee token
     * @param executionGas : amount of gas for which fee is to be charged
     */ 
    function _feeTransferHandler(uint256 tokenGasPrice, address _payer, address token, uint256 executionGas) internal returns(uint256 charge){
        // optional checks if token is allowed could be added     
        charge = tokenGasPrice.mul(executionGas).mul(feeMultiplier).div(10000);
        //Needs safe transfer from to support USDT SafeERC20.safeTransferFrom(IERC20(token),_payer, feeReceiver, charge)
         SafeERC20.safeTransferFrom(IERC20(token), _payer,feeReceiver,charge);
        /*require(IERC20(token).transferFrom(
            _payer,
            feeReceiver,
            charge));*/
    }

}