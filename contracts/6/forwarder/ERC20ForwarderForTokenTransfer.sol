// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../libs/Ownable.sol";
import "./ERC20ForwarderStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IFeeManager.sol";
import "./BiconomyForwarder.sol";
import "../interfaces/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ERC20 Forwarder
 *
 * @notice A contract for dApps to coordinate meta transactions paid for with ERC20 transfers
 * @notice This contract is upgradeable and using using unstructured proxy pattern.
 *         https://blog.openzeppelin.com/proxy-patterns/
 *         Users always interact with Proxy contract (storage layer) - ERC20ForwarderProxy.sol
 * @dev Inherits the ERC20ForwarderRequest struct from Storage contract (using same storage contract inherited by Proxy to avoid storage collisions) - essential for compatibility with The BiconomyForwarder
 * @dev Tx Flow : calls BiconomyForwarder to handle forwarding, call _transferHandler() to charge fee after
 *
 */
 contract ERC20ForwarderForTokenTransfer is Ownable, ERC20ForwarderStorage{
     using SafeMath for uint256;
     bool internal initialized;

    constructor(
        address _owner
    ) public Ownable(_owner){
        require(_owner != address(0), "Owner Address cannot be 0");
    }
      
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
       ) public {
        
        require(!initialized, "ERC20 Forwarder: contract is already initialized");
        require(
            _feeReceiver != address(0),
            "ERC20Forwarder: new fee receiver is the zero address"
        );
        require(
            _feeManager != address(0),
            "ERC20Forwarder: new fee manager is the zero address"
        );
        require(
            _forwarder != address(0),
            "ERC20Forwarder: new forwarder is the zero address"
        );
        initialized = true;
        feeReceiver = _feeReceiver;
        feeManager = _feeManager;
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
    
    function setGasRefund(uint128 refund) external onlyOwner{
        gasRefund = refund;
        emit GasRefundChanged(gasRefund,msg.sender);
    }

    function setGasTokenForwarderBaseGas(uint128 gas) external onlyOwner{
        gasTokenForwarderBaseGas = gas;
        emit GasTokenForwarderBaseGasChanged(gasTokenForwarderBaseGas,msg.sender);
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

    /* Designed to enable the community to track change in refundGas which is used to benefit users when gas tokens are burned
       Likely to change in the event of offsetting Biconomy's cost OR when new gas tokens are used */
    event GasRefundChanged(uint128 newGasRefund, address indexed actor);

    /* Designed to enable the community to track change in gas token forwarder base gas which is Biconomy's cost when gas tokens are burned for refund
       Likely to change in the event of offsetting Biconomy's cost OR when new gas token forwarder is used */
    event GasTokenForwarderBaseGasChanged(uint128 newGasTokenForwarderBaseGas, address indexed actor);
 
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
        nonce = BiconomyForwarder(forwarder).getNonce(from,batchId);
    }
    
    
     /**
     * @dev
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     */
    /**
     * @param req : the request being forwarded
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
            (success,ret) = BiconomyForwarder(forwarder).executeEIP712(req,domainSeparator,sig);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(transferHandlerGas).sub(postGas));
            emit FeeCharged(req.from,charge,req.token);
    }

    // do we need req, domainSeparator and signature? 
    // or just pass from, to, token and amount as paramters
    function executeTransferERC20AndChargeTokens(
        ERC20TokenTransferRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            // decode amount and fees from the data
            uint256 _value;
            address _to;
            (_to, _value) = abi.decode(req.data, (address,uint256));
            require(IERC20(req.token).transferFrom(req.from,_to,_value));
            //require(IERC20(token).transferFrom(req.to,amount));

            /*There is no need of biconomy forwarder since there is no data to forward to recipient
              But we still need to verify signature somehow
              can we use modified verifyEIP712 (and update nonce) method with different or same request type? 
            */

            //(success,ret) = BiconomyForwarder(forwarder).executeEIP712(req,domainSeparator,sig);
            uint256 postGas = gasleft();
            // transfer handler gas also needs to use custom one here
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(transferHandlerGas).sub(postGas));
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
     * @param req : the request being forwarded
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
            (success,ret) = BiconomyForwarder(forwarder).executeEIP712(req,domainSeparator,sig);
            //DAI permit
            IERC20Permit(req.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.nonce, permitOptions.expiry, permitOptions.allowed, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(transferHandlerGas).sub(postGas));
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
     * @param req : the request being forwarded
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
            (success,ret) = BiconomyForwarder(forwarder).executeEIP712(req,domainSeparator,sig);
            //USDC or any EIP2612 permit
            IERC20Permit(req.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.value, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(transferHandlerGas).sub(postGas));
            emit FeeCharged(req.from,charge,req.token);
    }

     /**
     * @dev
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     *  * NOT INTENTED TO BE CALLED : may need to be called by Biconomy Relayers
     */
    /**
     * @param req : the request being forwarded
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @param gasTokensBurned : number of gas tokens to be burned in this transaction
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executeEIP712WithGasTokens( 
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig,
        uint256 gasTokensBurned
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarder(forwarder).executeEIP712(req,domainSeparator,sig);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandlerCustom(req,initialGas.add(baseGas).add(gasTokenForwarderBaseGas).add(transferHandlerGas).sub(postGas).sub(gasTokensBurned.mul(gasRefund)));
            emit FeeCharged(req.from,charge,req.token);
    }

    /**
     * @dev
     * - calls permit method on the underlying ERC20 token contract (DAI permit type) with given permit options
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     *  * NOT INTENTED TO BE CALLED : may need to be called by Biconomy Relayers
     */
    /**
     * @param req : the request being forwarded
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @param gasTokensBurned : number of gas tokens to be burned in this transaction
     * @param permitOptions : the permit request options for executing permit. Since it is not EIP2612 permit pass permitOptions.value = 0 for this struct.  
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function permitAndExecuteEIP712WithGasTokens( 
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig,
        PermitRequest calldata permitOptions,
        uint256 gasTokensBurned
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarder(forwarder).executeEIP712(req,domainSeparator,sig);
            //DAI Permit
            IERC20Permit(req.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.nonce, permitOptions.expiry, permitOptions.allowed, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(gasTokenForwarderBaseGas).add(transferHandlerGas).sub(postGas).sub(gasTokensBurned.mul(gasRefund)));
            emit FeeCharged(req.from,charge,req.token);
    }

    /**
     * @dev
     * - calls permit method on the underlying ERC20 token contract (which supports EIP2612 permit) with given permit options
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executeEIP712 method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executeEIP712 call
     *  * NOT INTENTED TO BE CALLED : may need to be called by Biconomy Relayers
     */
    /**
     * @param req : the request being forwarded
     * @param domainSeparator : the domain separator presented to the user when signing
     * @param sig : the signature generated by the user's wallet
     * @param gasTokensBurned : number of gas tokens to be burned in this transaction
     * @param permitOptions : the permit request options for executing permit. Since it is EIP2612 permit pass permitOptions.allowed = true/false for this struct. 
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function permitEIP2612AndExecuteEIP712WithGasTokens( 
        ERC20ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes calldata sig,
        PermitRequest calldata permitOptions,
        uint256 gasTokensBurned
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarder(forwarder).executeEIP712(req,domainSeparator,sig);
            //EIP2612 Permit
            IERC20Permit(req.token).permit(permitOptions.holder, permitOptions.spender, permitOptions.value, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(gasTokenForwarderBaseGas).add(transferHandlerGas).sub(postGas).sub(gasTokensBurned.mul(gasRefund)));
            emit FeeCharged(req.from,charge,req.token);
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
            (success,ret) = BiconomyForwarder(forwarder).executePersonalSign(req,sig);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(transferHandlerGas).sub(postGas));
            emit FeeCharged(req.from,charge,req.token);
    }

    /**
     * @dev
     * - Keeps track of gas consumed
     * - Calls BiconomyForwarder.executePersonalSign method using arguments given
     * - Calls _transferHandler, supplying the gas usage of the executePersonalSign call
     *   NOT INTENTED TO BE CALLED : may need to be called by Biconomy Relayers
    **/
    /**
     * @param req : the request being forwarded
     * @param sig : the signature generated by the user's wallet
     * @param gasTokensBurned : number of gas tokens to be burned in this transaction
     * @return success : false if call fails. true otherwise
     * @return ret : any return data from the call
     */
    function executePersonalSignWithGasTokens(
        ERC20ForwardRequest calldata req,
        bytes calldata sig,
        uint256 gasTokensBurned
        )
        external 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = BiconomyForwarder(forwarder).executePersonalSign(req,sig);
            uint256 postGas = gasleft();
            uint256 transferHandlerGas = transferHandlerGas[req.token];
            uint256 charge = _transferHandler(req,initialGas.add(baseGas).add(gasTokenForwarderBaseGas).add(transferHandlerGas).sub(postGas).sub(gasTokensBurned.mul(gasRefund)));
            emit FeeCharged(req.from,charge,req.token);
    }

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
    function _transferHandler(ERC20ForwardRequest calldata req,uint256 executionGas) internal returns(uint256 charge){
        IFeeManager _feeManager = IFeeManager(feeManager);
        require(_feeManager.getTokenAllowed(req.token),"TOKEN NOT ALLOWED BY FEE MANAGER");        
        charge = req.tokenGasPrice.mul(executionGas).mul(_feeManager.getFeeMultiplier(req.from,req.token)).div(10000);
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

    function _transferHandlerCustom(ERC20ForwardRequest calldata req,uint256 executionGas) internal returns(uint256 charge){
        IFeeManager _feeManager = IFeeManager(feeManager);
        require(_feeManager.getTokenAllowed(req.token),"TOKEN NOT ALLOWED BY FEE MANAGER");        
        charge = req.tokenGasPrice.mul(executionGas).mul(_feeManager.getFeeMultiplier(req.from,req.token)).div(10000);
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
       
 }