pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Forwarder.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract ERC20Forwarder is Forwarder {

    using SafeMath for uint256;

    uint256 transferHandlerGas;

    constructor() public {
        string memory requestType = string(abi.encodePacked("ERC20ForwardRequest(", GENERIC_PARAMS, 
        ",address token,address feeReceiver,uint256 price,uint256 gasToCover)"));
        registerRequestTypeInternal(requestType);
        transferHandlerGas = 100000; //safe figure we can change later to be more accurate
    }

    function executePersonalSign(ForwardRequest memory req,bytes32 domainSeparator,bytes32 requestTypeHash,bytes calldata suffixData,bytes calldata sig) 
    external payable 
    returns(bool success, bytes memory ret){
        _verifyNonce(req);
        _verifySigPersonalSign(req, domainSeparator, requestTypeHash, suffixData, sig);
        _updateNonce(req);

        // solhint-disable-next-line avoid-low-level-calls
        (success,ret) = req.to.call{gas : req.gas, value : req.value}(abi.encodePacked(req.data, req.from));
        if ( address(this).balance>0 ) {
            //can't fail: req.from signed (off-chain) the request, so it must be an EOA...
            payable(req.from).transfer(address(this).balance);
        }
        return (success,ret);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function _verifySigPersonalSign(
        ForwardRequest memory req,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes memory suffixData,
        bytes memory sig)
    internal
    view
    {

        require(typeHashes[requestTypeHash], "invalid request typehash");
        bytes32 digest = prefixed(keccak256(abi.encodePacked(
                "\x19\x01", domainSeparator,
                keccak256(_getEncoded(req, requestTypeHash, suffixData))
            )));
        require(digest.recover(sig) == req.from, "signature mismatch");
    }


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
            (success,ret) = this.execute.value(req.value)(req,domainSeparator,requestTypeHash,suffixData,sig);
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
            (success,ret) = this.executePersonalSign.value(req.value)(req,domainSeparator,requestTypeHash,suffixData,sig);
            uint256 postGas = gasleft();
            _transferHandler(req,suffixData,initialGas.sub(postGas));
    }


    function _transferHandler(ForwardRequest memory req,bytes memory suffixData,uint256 executionGas) internal{
        (address token,address feeReceiver,uint256 price,uint256 gasToCover) = abi.decode(suffixData,(address,address,uint256,uint256));
        gasToCover = executionGas < gasToCover ? executionGas : gasToCover;
        require(IERC20(token).transferFrom(req.from,feeReceiver,price.mul(gasToCover.add(transferHandlerGas))));
    }

}