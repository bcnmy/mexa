const {ethers} = require("hardhat");

const makeDaiPermit = async (holder, spender, nonce) => {
    const daiContractAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const expiry = Math.floor(((new Date).getTime() / 1000) + 1000);
    const domain = {
        name: "Dai Stablecoin",
        version: "1",
        chainId: 1,
        verifyingContract: daiContractAddress,
    };
    const Permit = [
        {name: "holder", type: "address"},
        {name: "spender", type: "address"},
        {name: "nonce", type: "uint256"},
        {name: "expiry", type: "uint256"},
        {name: "allowed", type: "bool"},
    ];
    const message = {
        holder: holder.address,
        spender,
        nonce,
        expiry,
        allowed: true,
    };
    const types = {
        Permit
    };
    signature = await holder._signTypedData(domain, types, message);
    const {v, r, s} = getSignatureParameters(signature);
    return {v, r, s, message};
}

const makeUsdcPermit = async (holder, spender, nonce, value) => {
    const usdcContractAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const deadline = Math.floor(((new Date).getTime() / 1000) + 1000);
    const domain = {
        name: "USD Coin",
        version: "2",
        chainId: 1,
        verifyingContract: usdcContractAddress,
    };
    const Permit = [
        {name: "owner", type: "address"},
        {name: "spender", type: "address"},
        {name: "value", type: "uint256"},
        {name: "nonce", type: "uint256"},
        {name: "deadline", type: "uint256"},
    ];
    const message = {
        owner: holder.address,
        spender,
        value,
        nonce,
        deadline
    };
    const types = {
        Permit
    };
    signature = await holder._signTypedData(domain, types, message);
    const {v, r, s} = getSignatureParameters(signature);
    return {v, r, s, message};
    
}

const getSignatureParameters = signature => {
    if (!ethers.utils.isHexString(signature)) {
        throw new Error(
            'Given value "'.concat(signature, '" is not a valid hex string.')
        );
    }
    var r = signature.slice(0, 66);
    var s = "0x".concat(signature.slice(66, 130));
    var v = "0x".concat(signature.slice(130, 132));
    v = ethers.BigNumber.from(v).toNumber();
    if (![27, 28].includes(v)) v += 27;
    return {
        r: r,
        s: s,
        v: v
    };
};

module.exports = {getSignatureParameters, makeDaiPermit, makeUsdcPermit}