pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BiconomyForwarder.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IFeeMultiplier.sol";
import "./ERC20ForwardRequest.sol";

contract ERC20FeeProxy is ERC20ForwarderRequest{
    
    using SafeMath for uint256;
    uint256 transferHandlerGas;
    BiconomyForwarder forwarder;

    constructor(address payable _forwarder, uint256 tHGas) public {
        forwarder = BiconomyForwarder(_forwarder);
        transferHandlerGas = tHGas; //safe figure we can change later to be more accurate
    }

    function getNonce(address from)
    external view
    returns(uint256){
        uint256 nonce = forwarder.getNonce(from);
        return nonce;
    }

    function executeEIP712(
        ERC20ForwardRequest memory req,
        bytes32 domainSeparator,
        bytes calldata sig
        ) 
        external payable 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = forwarder.executeEIP712.value(req.msgValue)(req,domainSeparator,sig);
            uint256 postGas = gasleft();
            _transferHandler(req,initialGas.sub(postGas));
            if ( address(this).balance>0 ) {
            //can't fail: req.from signed (off-chain) the request, so it must be an EOA...
            payable(req.from).transfer(address(this).balance);
        }
    }


    function executePersonalSign(
        ERC20ForwardRequest memory req,
        bytes calldata sig
        ) 
        external payable 
        returns (bool success, bytes memory ret){
            uint256 initialGas = gasleft();
            (success,ret) = forwarder.executePersonalSign.value(req.msgValue)(req,sig);
            uint256 postGas = gasleft();
            _transferHandler(req,initialGas.sub(postGas));
            if ( address(this).balance>0 ) {
            //can't fail: req.from signed (off-chain) the request, so it must be an EOA...
            payable(req.from).transfer(address(this).balance);
        }
    }

    //good
    function _transferHandler(ERC20ForwardRequest memory req,uint256 executionGas) internal{
        uint16 multiplierBasisPoints = IFeeMultiplier(req.feeMultiplierManager).getFeeMultiplier(req.from,req.token);
        require(IERC20(req.token).transferFrom(
            req.from,
            req.feeReceiver,
            req.price.mul(executionGas.add(transferHandlerGas)).mul(multiplierBasisPoints).div(10000)));
    }


}

