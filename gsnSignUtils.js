//(forwarder,to,contractObject,functStr,params) => hash
//(forwarder,signer,contractObject,functStr,params) => signedMessage
const ethers = require('ethers');
const abi = require('ethereumjs-abi');
const { toBuffer } = require( 'ethereumjs-util');

const psForwarderMakeTransaction = async(signer,domainData,requestTypeHash,forwarder,contract,_value,functionStr,callParams,suffixTypes=[],suffixParams=[]) =>{
    //getCallData
    const innerTx = await contract.populateTransaction[functionStr](...callParams);
    //calculate gas
    /**const domainSeperator = ethers.utils.keccak256((ethers.utils.defaultAbiCoder).
                            encode(['bytes32','bytes32','bytes32','uint256','address'],
                            [ethers.utils.id("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                            ethers.utils.id(domainData.name),
                            ethers.utils.id(domainData.version),domainData.chainId,domainData.verifyingContract]));**/

    innerTx.from = await signer.getAddress();
    innerTx.nonce = await forwarder.getNonce(innerTx.from);
    innerTx.gas = innerTx.gasLimit;
    innerTx.value = _value;
    delete innerTx.gasPrice;
    delete innerTx.gasLimit;
    delete innerTx.chainId;
    const suffixData = (ethers.utils.defaultAbiCoder).encode(suffixTypes,suffixParams);
    //do this locally in future
    const _getEncoded =   await forwarder._getEncoded(innerTx,requestTypeHash,suffixData);
    //const psForwarderHash = abi.soliditySHA3(["bytes32","bytes32"],[domainSeperator,ethers.utils.keccak256(_getEncoded)]);
    const signedMessage = await signer.signMessage(ethers.utils.keccak256(_getEncoded));
    return {req:innerTx, sig:signedMessage, sd:toBuffer(suffixData)}
}

/**DOMAIN_SEPARATOR = keccak256(abi.encode(
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
    keccak256("TestnetDAI"),
    keccak256(bytes("1")),
    getChainID(),
    address(this)
));**/

exports.psForwarderMakeTransaction = psForwarderMakeTransaction;

/**
 *  return abi.encodePacked(
            requestTypeHash,
            abi.encode(
                req.from,
                req.to,
                req.value,
                req.gas,
                req.nonce,
                keccak256(req.data)
            ),
            suffixData
        );
 */