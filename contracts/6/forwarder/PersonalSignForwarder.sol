pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

//to do, seperate into forwarderWithPersonalSign.sol and ERC20Forwarder.sol

import "@opengsn/gsn/contracts/forwarder/Forwarder.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract PersonalSignForwarder is Forwarder {

    function executePersonalSign(ForwardRequest memory req,bytes32 requestTypeHash,bytes calldata suffixData,bytes calldata sig) 
    external payable 
    returns(bool success, bytes memory ret){
        _verifyNonce(req);
        _verifySigPersonalSign(req, requestTypeHash, suffixData, sig);
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
        bytes32 requestTypeHash,
        bytes memory suffixData,
        bytes memory sig)
    internal
    view
    {

        require(typeHashes[requestTypeHash], "invalid request typehash");
        bytes32 digest = prefixed(keccak256(_getEncoded(req, requestTypeHash, suffixData))
            );
        require(digest.recover(sig) == req.from, "signature mismatch");
    }
}
