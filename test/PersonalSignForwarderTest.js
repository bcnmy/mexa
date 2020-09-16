const { expect } = require("chai");
var abi = require('ethereumjs-abi');
const { toBuffer } = require( 'ethereumjs-util');
const walletUtils = require("../walletUtils");

//make mock baseRelayRecipient contract
//personal sign method that can be re-used
/**
 * setup
 * - deploy all contracts
 * -- forwarder
 * -- testRecipient
 * -- accounts = hdwallet();
 * cases 
 * - throws on invalid signature
 * - throws on invalid nonce
 * - success on correct signature
 * -- updates nonce on forwarder
 * -- updates nonce on test contract
 * -- no throws
 */

describe("PersonalSignForwarder", function () {

    let accounts;
    let forwarder;
    let testRecipient;

    before(async function(){
        accounts = walletUtils.makeSignerList(num=2);
        
        const Forwarder = await ethers.getContractFactory("PersonalSignForwarder");
        forwarder = await Forwarder.deploy();
        await forwarder.deployed();

        const TestRecipient = await ethers.getContractFactory("TestRecipient");
        testRecipient = await TestRecipient.deploy(forwarder.address);
        await testRecipient.deployed();
    });

    it("Should accept valid personal signature", async function(){ 
        //function to convert functionCall + signature into a populated OpenGSN personalSign Tx
        const functStr = 'doCall';
        const params = [await accounts[0].getAddress()];
        //contract.function = TestRecipient.populateTransaction.doCall
        //(forwarder,to,contractObject,functStr,params) => hash
        //(forwarder,signer,contractObject,functStr,params) => signedMessage
    });

    it("Should update nonce when valid transaction is forwarded", async function(){
        
    });

    it("Should throw when nonce is invalid for personal signature", async function(){

    });

    it("Should throw when signer is incorrect", async function(){

    });

    it("Should throw when signature is invalid", async function(){

    });

})