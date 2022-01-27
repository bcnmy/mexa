// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./ForwardRequestTypesV2.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IFeeManager.sol";
import "./BiconomyForwarderV2Beta.sol";
import "./OracleAggregator.sol";
import "../interfaces/IERC20Permit.sol";

/**
 * @title ERC20 Forwarder
 *
 * @notice A contract for dApps to coordinate meta transactions paid for with ERC20 transfers
 * @notice This contract is upgradeable and using using transparent proxy pattern.
 * @dev Inherits Forward Request structs from Forward Request Types
 * @dev Txn Flow : calls BiconomyForwarder to handle forwarding, call _transferHandler() to charge fee after
 *
 */
          
 contract ERC20ForwarderImplementationV2Beta is Initializable, OwnableUpgradeable, ForwardRequestTypesV2 {
     
    uint8 internal _initializedVersion;
    mapping(address=>uint256) public transferHandlerGas;
    mapping(address=>bool) public safeTransferRequired;
    //TODO
    //different fee receiver con fig can be added by Owner / fee manager owner?
    address public feeReceiver;
    address public oracleAggregator;
    //TODO
    //@review owner can add multiple fee managers for dapps?
    address public feeManager;
    address public forwarder;
    //transaction base gas
    uint128 public baseGas=21000;

     /**
     * @dev sets contract variables
     *
     * @param _feeReceiver : address that will receive fees charged in ERC20 tokens
     * @param _feeManager : the address of the contract that controls the charging of fees
     * @param _forwarder : the address of the BiconomyForwarder contract
     *
     */
       function initialize(
       address _feeReceiver,
       address _feeManager,
       address payable _forwarder
       ) public initializer {
        require(
            _feeReceiver != address(0),
            "ERC20Forwarder: fee receiver can not be zero address"
        );
        require(
            _feeManager != address(0),
            "ERC20Forwarder: fee manager can not be zero address"
        );
        require(
            _forwarder != address(0),
            "ERC20Forwarder: trusted forwarder can not be zero address"
        );
        __Ownable_init();
        _initializedVersion = 0;
        feeReceiver = _feeReceiver;
        feeManager = _feeManager; //@review should we allow to register multiple fee managers?
        forwarder = _forwarder;
       }

    function setOracleAggregator(address oa) external onlyOwner{
        require(
            oa != address(0),
            "ERC20Forwarder: new oracle aggregator can not be a zero address"
        );
        oracleAggregator = oa;
        emit OracleAggregatorChanged(oracleAggregator, msg.sender);
    }


    function setTrustedForwarder(address payable _forwarder) external onlyOwner {
        require(
            _forwarder != address(0),
            "ERC20Forwarder: new trusted forwarder can not be a zero address"
        );
        forwarder = _forwarder;
        emit TrustedForwarderChanged(forwarder, msg.sender);
    }

    /**
     * @dev enable dApps to change fee receiver addresses, e.g. for rotating keys/security purposes
     * @param _feeReceiver : address that will receive fees charged in ERC20 tokens */
    function setFeeReceiver(address _feeReceiver) external onlyOwner{
        require(
            _feeReceiver != address(0),
            "ERC20Forwarder: new fee receiver can not be a zero address"
        );
        feeReceiver = _feeReceiver;
    }

    /**
     * @dev enable dApps to change the contract that manages fee collection logic
     * @param _feeManager : the address of the contract that controls the charging of fees */
    function setFeeManager(address _feeManager) external onlyOwner{
        require(
            _feeManager != address(0),
            "ERC20Forwarder: new fee manager can not be a zero address"
        );
        feeManager = _feeManager;
    }

    function setBaseGas(uint128 gas) external onlyOwner{
        baseGas = gas;
        emit BaseGasChanged(baseGas,msg.sender);
    }

    /**
     * Designed to enable the community to track change in storage variable forwarder which is used
     * as a trusted forwarder contract where signature verifiction and replay attack prevention schemes are
     * deployed.
     */
    event TrustedForwarderChanged(address indexed newForwarderAddress, address indexed actor);

    /**
     * Designed to enable the community to track change in storage variable oracleAggregator which is used
     * as a oracle aggregator contract where different feeds are aggregated
     */
    event OracleAggregatorChanged(address indexed newOracleAggregatorAddress, address indexed actor);

    /* Designed to enable the community to track change in storage variable baseGas which is used for charge calcuations 
       Unlikely to change */
    event BaseGasChanged(uint128 newBaseGas, address indexed actor);

    /* Designed to enable the community to track change in storage variable transfer handler gas for particular ERC20 token which is used for charge calculations
       Only likely to change to offset the charged fee */ 
    event TransferHandlerGasChanged(address indexed tokenAddress, address indexed actor, uint256 indexed newGas);

    /**
     * @dev change amount of excess gas charged for _transferHandler
     * NOT INTENTED TO BE CALLED : may need to be called if :
     * - new feeManager consumes more/less gas
     * - token contract is upgraded to consume less gas
     * - etc
     */
     /// @param _transferHandlerGas : max amount of gas the function _transferHandler is expected to use
    function setTransferHandlerGas(address token, uint256 _transferHandlerGas) external onlyOwner{
        require(
            token != address(0),
            "token cannot be zero"
       );
        transferHandlerGas[token] = _transferHandlerGas;
        emit TransferHandlerGasChanged(token,msg.sender,_transferHandlerGas);
    }

    function setSafeTransferRequired(address token, bool _safeTransferRequired) external onlyOwner{
        require(
            token != address(0),
            "token cannot be zero"
       );
        safeTransferRequired[token] = _safeTransferRequired;
    }

    /**
     * @dev calls the getNonce function of the BiconomyForwarder
     * @param from : the user address
     * @param batchId : the key of the user's batch being queried
     * @return nonce : the number of transaction made within said batch
     */
    function getNonce(address from, uint256 batchId)
    external view
    returns(uint256 nonce){
        nonce = BiconomyForwarderV2Beta(forwarder).getNonce(from,batchId);
    }

     /**
     * @dev
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     */
    /**
     * @param req : ERC20 forward request being forwarded
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
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarderV2Beta(forwarder).executeEIP712(req,domainSeparator,sig);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas + baseGas + transferHandlerGas - postGas);
            emit FeeCharged(req.from,charge,req.token);
    }

    /**
     * @dev
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     */
    /**
     * @param req : Custom ERC20 forward request being forwarded
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
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarderV2Beta(forwarder).executeEIP712(req,domainSeparator,sig);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.request.token];
            uint256 charge = _transferHandler(req,initialGas + baseGas + transferHandlerGas - postGas);
            emit FeeCharged(req.request.from,charge,req.request.token);
    }

    /**
     * @dev
     * - calls permit method on the underlying ERC20 token contract (DAI permit type) with given permit options
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     */
    /**
     * @param req : ERC20 forward request being forwarded
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @param permitOptions : the permit request options for executing permit. Since it is not EIP2612 permit pass permitOptions.value = 0 for this struct. 
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function permitAndExecuteEIP712(
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig,
        PermitRequest calldata permitOptions
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarderV2Beta(forwarder).executeEIP712(req,domainSeparator,sig);
            //DAI permit
            IERC20Permit(req.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.nonce, permitOptions.expiry, permitOptions.allowed, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas + baseGas + transferHandlerGas - postGas);
            emit FeeCharged(req.from,charge,req.token);
    }
    
    /**
     * @dev
     * - calls permit method on the underlying ERC20 token contract (DAI permit type) with given permit options
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     */
    /**
     * @param req : Custom ERC20 forward request being forwarded
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @param permitOptions : the permit request options for executing permit. Since it is not EIP2612 permit pass permitOptions.value = 0 for this struct. 
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function permitAndExecuteEIP712(
        CustomForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig,
        PermitRequest calldata permitOptions
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarderV2Beta(forwarder).executeEIP712(req,domainSeparator,sig);
            //DAI permit
            IERC20Permit(req.request.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.nonce, permitOptions.expiry, permitOptions.allowed, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.request.token];
            uint256 charge = _transferHandler(req,initialGas + baseGas + transferHandlerGas - postGas);
            emit FeeCharged(req.request.from,charge,req.request.token);
    }

    /**
     * @dev
     * - calls permit method on the underlying ERC20 token contract (which supports EIP2612 permit) with given permit options
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     */
    /**
     * @param req : ERC20 forward request being forwarded
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @param permitOptions : the permit request options for executing permit. Since it is EIP2612 permit pass permitOptions.allowed = true/false for this struct. 
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function permitEIP2612AndExecuteEIP712(
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig,
        PermitRequest calldata permitOptions
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarderV2Beta(forwarder).executeEIP712(req,domainSeparator,sig);
            //USDC or any EIP2612 permit
            IERC20Permit(req.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.value, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas + baseGas + transferHandlerGas - postGas);
            emit FeeCharged(req.from,charge,req.token);
    }

    /**
     * @dev
     * - calls permit method on the underlying ERC20 token contract (which supports EIP2612 permit) with given permit options
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     */
    /**
     * @param req : Custom ERC20 forward request being forwarded
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @param permitOptions : the permit request options for executing permit. Since it is EIP2612 permit pass permitOptions.allowed = true/false for this struct. 
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function permitEIP2612AndExecuteEIP712(
        CustomForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig,
        PermitRequest calldata permitOptions
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarderV2Beta(forwarder).executeEIP712(req,domainSeparator,sig);
            //USDC or any EIP2612 permit
            IERC20Permit(req.request.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.value, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.request.token];
            uint256 charge = _transferHandler(req,initialGas + baseGas + transferHandlerGas - postGas);
            emit FeeCharged(req.request.from,charge,req.request.token);
    }

    /**
     * @dev
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executePersonalSign method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executePersonalSign call
    **/
    /**
     * @param req : the request being forwarded
     * @param sig : the signature generated by the user's wallet
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executePersonalSign(
        ERC20ForwardRequest calldata req,
        bytes calldata sig
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarderV2Beta(forwarder).executePersonalSign(req,sig);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas + baseGas + transferHandlerGas - postGas);
            emit FeeCharged(req.from,charge,req.token);
    }

    //@notice personal sign support is not added for Custom ERC20 forward request

    // Designed to enable capturing token fees charged during the execution
    event FeeCharged(address indexed from, uint256 indexed charge, address indexed token);

    /**
     * @dev
     * - Verifies if token supplied in request is allowed
     * - Transfers tokenGasPrice*totalGas*feeMultiplier $req.token, from req.to to feeReceiver
    **/
    /**
     * @param req : the request being forwarded
     * @param executionGas : amount of gas used to execute the forwarded request call
     */
    //@review tokenGasPrice on chain verification using oracle. can add threshold 
    function _transferHandler(ERC20ForwardRequest calldata req,uint256 executionGas) internal returns(uint256 charge){
        IFeeManager _feeManager = IFeeManager(feeManager);
        require(_feeManager.getTokenAllowed(req.token),"TOKEN NOT ALLOWED BY FEE MANAGER");
        OracleAggregator oa = OracleAggregator(oracleAggregator);
        uint256 tokenGasPriceNow = tx.gasprice * (10 ** oa.getTokenOracleDecimals(req.token)) / (oa.getTokenPrice(req.token));
        require(req.tokenGasPrice >= tokenGasPriceNow, "Transfer Handler: Pre flight checks on token gas price has failed");        
        charge = req.tokenGasPrice * executionGas * (_feeManager.getFeeMultiplier(req.from,req.token)) / 10000;
        if (!safeTransferRequired[req.token]){
            
            require(IERC20(req.token).transferFrom(
            req.from,
            feeReceiver,
            charge));
        }
        else{
            SafeERC20.safeTransferFrom(IERC20(req.token), req.from,feeReceiver,charge);
        }
    }

    /**
     * @dev
     * - Verifies if token supplied in request is allowed
     * - Transfers tokenGasPrice*totalGas*feeMultiplier $req.token, from req.to to feeReceiver
    **/
    /**
     * @param req : Custom ERC20 forward request being forwarded
     * @param executionGas : amount of gas used to execute the forwarded request call
     */
    //@review tokenGasPrice on chain verification using oracle. can add threshold 
    function _transferHandler(CustomForwardRequest calldata req,uint256 executionGas) internal returns(uint256 charge){
        IFeeManager _feeManager = IFeeManager(feeManager);
        require(_feeManager.getTokenAllowed(req.request.token),"TOKEN NOT ALLOWED BY FEE MANAGER");   
        OracleAggregator oa = OracleAggregator(oracleAggregator);
        uint256 tokenGasPriceNow = tx.gasprice * (10 ** oa.getTokenOracleDecimals(req.request.token)) / (oa.getTokenPrice(req.request.token));
        require(req.request.tokenGasPrice >= tokenGasPriceNow, "Transfer Handler: Pre flight checks on token gas price has failed");             
        charge = req.request.tokenGasPrice * executionGas * (_feeManager.getFeeMultiplier(req.request.from,req.request.token)) / 10000;
        if (!safeTransferRequired[req.request.token]){
            
            require(IERC20(req.request.token).transferFrom(
            req.request.from,
            feeReceiver,
            charge));
        }
        else{
            SafeERC20.safeTransferFrom(IERC20(req.request.token), req.request.from,feeReceiver,charge);
        }
    }

 }


