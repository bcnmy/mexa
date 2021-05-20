// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../libs/BaseRelayRecipient.sol";
import "../libs/Ownable.sol";
import "../interfaces/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract EmberTransferHandler is BaseRelayRecipient, Ownable{
    using SafeMath for uint256;

    //Ember fund fee receiver
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
    mapping(address=>uint256) public transferHandlerGas;

    constructor(address _forwarder, address _owner) public Ownable(_owner){
        trustedForwarder = _forwarder;
    }

    function setTrustedForwarder(address _forwarder) external onlyOwner {
        trustedForwarder = _forwarder;
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

    function versionRecipient() external virtual view override returns (string memory){ return "1";}

    // Designed to enable capturing token fees charged during the execution
    event FeeCharged(address indexed from, uint256 indexed charge, address indexed token);

    event BaseGasChanged(uint128 newBaseGas, address indexed actor);

    event FeeReceiverChanged(address newFeeReceiver, address indexed actor);

    event TransferHandlerGasChanged(address indexed tokenAddress, address indexed actor, uint256 indexed newGas);

    function transfer(uint256 tokenGasPrice, address token, address to, uint256 value) external{
        uint256 initialGas = gasleft();
        // needs safe transfer from to support USDT
        require(IERC20(token).transferFrom(_msgSender(),to,value));
        uint256 postGas = gasleft();
        uint256 charge = _feeTransferHandler(tokenGasPrice,_msgSender(),token,initialGas.add(baseGas).add(transferHandlerGas[token]).sub(postGas));
        emit FeeCharged(_msgSender(),charge,token);
    }

    function permitEIP2612AndTransfer(uint256 tokenGasPrice, address token, address to, uint256 value, PermitRequest calldata permitOptions) external{
        uint256 initialGas = gasleft();
        //USDC or any EIP2612 permit
        IERC20Permit(token).permit(_msgSender(), address(this), permitOptions.value, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
        //Needs safe transfer from to support USDT SafeERC20.safeTRansferFrom(IERC20(token),_msgSender(), to, value)
        require(IERC20(token).transferFrom(_msgSender(),to,value));
        uint256 postGas = gasleft();
        uint256 charge = _feeTransferHandler(tokenGasPrice,_msgSender(),token,initialGas.add(baseGas).add(transferHandlerGas[token]).sub(postGas));
        emit FeeCharged(_msgSender(),charge,token);
    }

    function permitEIP2612UnlimitedAndTransfer(uint256 tokenGasPrice, address token, address to, uint256 value, PermitRequest calldata permitOptions) external{
        uint256 initialGas = gasleft();
        //USDC or any EIP2612 permit
        IERC20Permit(token).permit(_msgSender(), address(this), type(uint256).max, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
        //Needs safe transfer from to support USDT SafeERC20.safeTRansferFrom(IERC20(token),_msgSender(), to, value)
        require(IERC20(token).transferFrom(_msgSender(),to,value));
        uint256 postGas = gasleft();
        uint256 charge = _feeTransferHandler(tokenGasPrice,_msgSender(),token,initialGas.add(baseGas).add(transferHandlerGas[token]).sub(postGas));
        emit FeeCharged(_msgSender(),charge,token);
    }

    function _feeTransferHandler(uint256 tokenGasPrice, address _payer, address token, uint256 executionGas) internal returns(uint256 charge){
        // checks if token is allowed     
        // now we need token gas price for this 
        charge = tokenGasPrice.mul(executionGas).mul(feeMultiplier).div(10000);
        //Needs safe transfer from to support USDT SafeERC20.safeTRansferFrom(IERC20(token),_payer, feeReceiver, charge)
        require(IERC20(token).transferFrom(
            _payer,
            feeReceiver,
            charge));
    }

}