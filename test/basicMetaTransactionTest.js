const { expect } = require("chai");
var abi = require('ethereumjs-abi');
const { toBuffer } = require( 'ethereumjs-util');
const walletUtils = require("../walletUtils");

describe("Basic Meta Transaction", function(){
    it("works", async function(){
        const [account] = walletUtils.makeSignerList(num=1);
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
        const hash = abi.soliditySHA3(['uint256','address','uint256','bytes'],[0,mbmtc.address,id.toNumber(),toBuffer(call.data)]);
        const signature = await account.signMessage(hash);
        const r = signature.slice(0, 66);
        const s = "0x".concat(signature.slice(66, 130));
        const v = parseInt(signature.substring(130, 132), 16);
        console.log("r : ",r," | s : ",s," | v : ",v);
        const tx = await mbmtc.executeMetaTransaction(await account.getAddress(),call.data,r,s,v);
        console.log(tx);
    })
});