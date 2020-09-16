const { expect } = require("chai");
var abi = require('ethereumjs-abi');
const { toBuffer } = require( 'ethereumjs-util');


// Doesn't work because :
//                          - Personal_sign not supported
//                          - Weird bug when attempting to imitate personal_sign using eth_sign
//                          - SIGNATURES DON'T MATCH EVEN THOUGH THEY MATCH WHEN RUN IN KOVAN...

describe("Basic Meta Transaction", function(){
    it("works", async function(){
        const [account] = await ethers.getSigners();
        const MBMTC = await ethers.getContractFactory("MockBasicMetaTxChild");
        const mbmtc = await MBMTC.deploy();
        console.log(account);
        await mbmtc.deployed();
        console.log("address ", mbmtc.address);
        const call = await mbmtc.populateTransaction.nonces("0x83db061396ba8c2Eaafe668f0D674d372fBe6d44");
        const sig = "0x28b5e32b";
        const id = await mbmtc.getChainID();
        console.log("Call data ",call.data);
        console.log("chain id ",id);
        const hash = abi.soliditySHA3(['uint256','address','uint256','bytes'],[12,"0xf5D53D5C38204b9dFbF68B780834e6c1e0FF5378",42,toBuffer("0x")]);
        console.log("0x"+hash.toString('hex'));
        const signature = "0x03d9ffeda32da9167a83bb1f6a5971bbebdd051d67b6789e03e2a51abe8f3f1f7cc692c8f314a1a33f22264067a380e0cd1a6004f2a2ae826ec278d5c00babf81b";
        const r = signature.slice(0, 66);
        const s = "0x".concat(signature.slice(66, 130));
        const v = parseInt(signature.substring(130, 132), 16);
        console.log("r : ",r," | s : ",s," | v : ",v);
        /**const tx = await mbmtc.executeMetaTransaction("0x83db061396ba8c2eaafe668f0d674d372fbe6d44","0x"+hash.toString('hex'),r,s,v);
        console.log(tx);**/
    })
});

//0x1e0bca4583d8201fd0ed6e7e3e38e7156c4ea8cb540d4afb56a2909c157c664f