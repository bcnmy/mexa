const { expect } = require("chai");
var abi = require('ethereumjs-abi');
const { toBuffer } = require( 'ethereumjs-util');
const walletUtils = require("../walletUtils");
const { psForwarderMakeTransaction } = require("../gsnSignUtils");

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
    let domainData;
    let requestTypeHash;
    let erc20ForwardRequestTypeHash;

    before(async function(){
        accounts = walletUtils.makeSignerList(num=2);
        
        const Forwarder = await ethers.getContractFactory("PersonalSignForwarder");
        forwarder = await Forwarder.deploy();
        await forwarder.deployed();
        //make custom typehash for erc20 fee related suffix data
        await forwarder.registerRequestType("ERC20ForwardRequest","address token,address feeReceiver,address feeMultiplierManager,uint256 price,uint256 gasToCover)");
        //add domain seperator

        const TestRecipient = await ethers.getContractFactory("TestRecipient");
        testRecipient = await TestRecipient.deploy(forwarder.address);
        await testRecipient.deployed();

        domainData = {
            name : "TestRecipient",
            version : "1",
            chainId : 42,
            verifyingContract : testRecipient.address
          };

        requestTypeHash = ethers.utils.id("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");
        erc20ForwardRequestTypeHash = ethers.utils.id("ERC20ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,address token,address feeReceiver,address feeMultiplierManager,uint256 price,uint256 gasToCover)");

    });

    it("Should accept valid personal signature", async function(){ 
        //function to convert functionCall + signature into a populated OpenGSN personalSign Tx
        const functStr = 'doCall';
        const {req,sig, sd} = await psForwarderMakeTransaction(accounts[1],domainData,requestTypeHash,forwarder,
            testRecipient,"0",functStr,[await accounts[1].getAddress()]);
        await forwarder.executePersonalSign(req,requestTypeHash,sd,sig);
        const callsMade = await testRecipient.callsMade(await accounts[1].getAddress());
        expect(callsMade).to.equal(1);
    });

    it("Should update nonce when valid transaction is forwarded", async function(){
        const nonce = await forwarder.getNonce(await accounts[1].getAddress());
        expect(nonce).to.equal(1);
    });

    it("Should throw when nonce is invalid for personal signature", async function(){
        
        const functionStr = 'doCall';
        const signer = accounts[1];
        const contract = testRecipient;

        
        const innerTx = await contract.populateTransaction[functionStr](await signer.getAddress());
        //calculate gas
        console.log("innerTx made");
        /**const domainSeperator = ethers.utils.keccak256((ethers.utils.defaultAbiCoder).
                            encode(['bytes32','bytes32','bytes32','uint256','address'],
                            [ethers.utils.id("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                            ethers.utils.id(domainData.name),
                            ethers.utils.id(domainData.version),domainData.chainId,domainData.verifyingContract]));**/

        innerTx.from = await signer.getAddress();
        innerTx.nonce = 0;
        innerTx.gas = innerTx.gasLimit;
        innerTx.value = 0;
        delete innerTx.gasPrice;
        delete innerTx.gasLimit;
        delete innerTx.chainId;
        const suffixData = (ethers.utils.defaultAbiCoder).encode([],[]);
    
        const _getEncoded = await forwarder._getEncoded(innerTx,requestTypeHash,suffixData);
        /**const psForwarderHash = abi.soliditySHA3(["bytes32","bytes32"],
                                [domainSeperator,ethers.utils.keccak256(_getEncoded)]);**/
        const signedMessage = await signer.signMessage(_getEncoded);
        
        await expect(forwarder.executePersonalSign(innerTx,requestTypeHash,suffixData,signedMessage)).to.be.revertedWith();

    });

    it("Should throw when signer is incorrect", async function(){
        const functStr = 'doCall';
        const {req,sig, sd} = await psForwarderMakeTransaction(accounts[1],domainData,requestTypeHash,forwarder,
            testRecipient,"0",functStr,[await accounts[1].getAddress()]);
        req.from = await accounts[0].getAddress();
        await expect(forwarder.executePersonalSign(req,requestTypeHash,sd,sig)).to.be.revertedWith();
    });

    it("Should work correctly when suffix data is added", async function(){
        const functStr = 'doCall';
        const {req,sig, sd} = await psForwarderMakeTransaction(accounts[1],domainData,erc20ForwardRequestTypeHash,
                                forwarder,testRecipient,"0",functStr,[await accounts[1].getAddress()],
                                suffixTypes=['address','address','address','uint256','uint256'],
                                suffixParams=[testRecipient.address,testRecipient.address,testRecipient.address,1000,1000]);
        
        await forwarder.executePersonalSign(req,requestTypeHash,sd,sig);
        const callsMade = await testRecipient.callsMade(await accounts[1].getAddress());
        expect(callsMade).to.equal(2);
    });

    //test cases for suffix data

})