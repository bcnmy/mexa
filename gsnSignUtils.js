//(forwarder,to,contractObject,functStr,params) => hash
//(forwarder,signer,contractObject,functStr,params) => signedMessage

const psForwarderSign = async (signer,domainSeperator,requestTypehash,forwarder,contract,functionStr,callParams,suffixParams) => {
    const hash = psForwarderHash(signer,domainSeperator,requestTypehash,forwarder,contract,functionStr,callParams,suffixParams);
    const signature = await signer.signMessage(hash);
    return signature;
}

const psForwarderHash = async (signer,domainSeperator,requestTypehash,forwarder,contract,functionStr,callParams,suffixParams) => {
    //getCallData
    //
}