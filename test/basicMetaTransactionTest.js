const { expect } = require("chai");
var abi = require('ethereumjs-abi');


// Doesn't work because :
//                          - Personal_sign not supported
//                          - Weird bug when attempting to imitate personal_sign using eth_sign
//                          - Weird bug where contract addresses aren't consist between tests

describe("Basic Meta Transaction", function(){
    it("works", async function(){
        const [account] = await ethers.getSigners();
        const MBMTC = await ethers.getContractFactory("MockBasicMetaTxChild");
        const mbmtc = await MBMTC.deploy();
        console.log(account);
        await mbmtc.deployed();
        console.log("address ", mbmtc.address);
        const call = await mbmtc.populateTransaction.call();
        const sig = "0x28b5e32b";
        const id = await mbmtc.getChainID();
        console.log("Call data ",call.data);
        console.log("chain id ",id);
        const hash = abi.soliditySHA3(['uint256','address','uint256','bytes4'],[0,mbmtc.address,id.toNumber(),call.data]);
        console.log("0x"+hash.toString('hex'));
        const signature = "0x51f7439efdcca695bd39e5321aab80cb6db93602a8f67bcbed5254102cdffc0e238b6e10d4e892b61de5ffbe890bc0c91ba2e913f99e512e469bc62fd4f0ba3d1b";
        const r = signature.slice(0, 66);
        const s = "0x".concat(signature.slice(66, 130));
        const v = parseInt(signature.substring(130, 132), 16);
        await mbmtc.executeMetaTransaction("0x83db061396ba8c2eaafe668f0d674d372fbe6d44","0x"+hash.toString('hex'),r,s,v);
    })
});

//0x1e0bca4583d8201fd0ed6e7e3e38e7156c4ea8cb540d4afb56a2909c157c664f