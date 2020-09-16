pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PersonalSignForwarder.sol";
import "@opengsn/gsn/contracts/forwarder/IForwarder.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interface/IFeeMultiplier.sol";

contract ERC20FeeProxy is IForwarder{
    
    using SafeMath for uint256;
    uint256 transferHandlerGas;
    PersonalSignForwarder forwarder;

    constructor(address payable _forwarder, uint256 tHGas) public {
        forwarder = PersonalSignForwarder(_forwarder);
        forwarder.registerRequestType("ERC20ForwardRequest(",",address token,address feeReceiver,address feeMultiplierManager,uint256 price,uint256 gasToCover)");
        transferHandlerGas = tHGas; //safe figure we can change later to be more accurate
    }

    function verify(
        ForwardRequest calldata forwardRequest,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata suffixData,
        bytes calldata signature
    ) external view override {revert("Not supported");}

    function getNonce(address from)
    external view override
    returns(uint256){ revert("not supported");}

    function execute(
        ForwardRequest calldata forwardRequest,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata suffixData,
        bytes calldata signature
    )
    external payable override
    returns (bool success, bytes memory ret){revert("not supported");}

    function registerRequestType(string calldata typeName, string calldata typeSuffix) external override{revert("not supported");}

    function erc20Execute(
        ForwardRequest memory req,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata suffixData,
        bytes calldata sig
        ) 
        external payable 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = forwarder.execute.value(req.value)(req,domainSeparator,requestTypeHash,suffixData,sig);
            uint256 postGas = gasleft();
            _transferHandler(req,suffixData,initialGas.sub(postGas));
    }

    function erc20ExecutePersonalSign(
        ForwardRequest memory req,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata suffixData,
        bytes calldata sig
        ) 
        external payable 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = forwarder.executePersonalSign.value(req.value)(req,domainSeparator,requestTypeHash,suffixData,sig);
            uint256 postGas = gasleft();
            _transferHandler(req,suffixData,initialGas.sub(postGas));
    }


    function _transferHandler(ForwardRequest memory req,bytes memory suffixData,uint256 executionGas) internal{
        (address token,address feeReceiver,address feeMultiplierManager,uint256 price,uint256 gasToCover) = 
        abi.decode(suffixData,(address,address,address,uint256,uint256));
        gasToCover = executionGas < gasToCover ? executionGas : gasToCover;
        uint16 multiplierBasisPoints = IFeeMultiplier(feeMultiplierManager).getFeeMultiplier(req.from,token);
        require(IERC20(token).transferFrom(req.from,feeReceiver,price.mul(gasToCover.add(transferHandlerGas)).
        mul(multiplierBasisPoints).
        div(10000)));
    }


}

