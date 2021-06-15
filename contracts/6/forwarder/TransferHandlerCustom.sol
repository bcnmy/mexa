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
     * @param tokenGasPrice : gas price in context of ERC20 token being used to pay fees
     * @param token : address of token contract being transferred and used to pay fees
     * @param to : recipient address
     * @param value : amount of token transferred to recipient
     * @param permitOptions : the permit request options for executing permit. Since it is EIP2612 permit pass permitOptions.allowed = true/false for this struct. 
     */
    function permitEIP2612AndTransfer(uint256 tokenGasPrice, address token, address to, uint256 value, PermitRequest calldata permitOptions) external{
        uint256 initialGas = gasleft();
        //USDC or any EIP2612 permit
        IERC20Permit(token).permit(permitOptions.holder, address(this), permitOptions.value, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
        //Needs safe transfer from to support USDT SafeERC20.safeTransferFrom(IERC20(token),msgSender(), to, value)
        require(IERC20(token).transferFrom(permitOptions.holder,to,value));
        uint256 postGas = gasleft();
        uint256 charge = _feeTransferHandler(tokenGasPrice,permitOptions.holder,token,initialGas.add(baseGas).add(transferHandlerGas[token]).sub(postGas));
        emit FeeCharged(permitOptions.holder,charge,token);
    }

    function permitEIP2612UnlimitedAndTransfer(uint256 tokenGasPrice, address token, address to, uint256 value, PermitRequest calldata permitOptions) external{
        uint256 initialGas = gasleft();
        //USDC or any EIP2612 permit
        IERC20Permit(token).permit(permitOptions.holder, address(this), type(uint256).max, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
        //Needs safe transfer from to support USDT SafeERC20.safeTransferFrom(IERC20(token),msgSender(), to, value)
        require(IERC20(token).transferFrom(permitOptions.holder,to,value));
        uint256 postGas = gasleft();
        uint256 charge = _feeTransferHandler(tokenGasPrice,permitOptions.holder,token,initialGas.add(baseGas).add(transferHandlerGas[token]).sub(postGas));
        emit FeeCharged(permitOptions.holder,charge,token);
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