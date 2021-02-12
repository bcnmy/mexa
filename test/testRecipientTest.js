const { expect } = require("chai");
const abi = require('ethereumjs-abi');

describe("Test Recipient", function(){

    let accounts;
    let testRecipient;
    let forwarder;
    let domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "salt", type: "uint256" },
        { name: "verifyingContract", type: "address" }
      ];

    let erc20ForwardRequest = [
        {name:'from',type:'address'},
        {name:'to',type:'address'},
        {name:'token',type:'address'},
        {name:'txGas',type:'uint256'},
        {name:'tokenGasPrice',type:'uint256'},
        {name:'batchId',type:'uint256'},
        {name:'batchNonce',type:'uint256'},
        {name:'deadline',type:'uint256'},
        {name:'dataHash',type:'bytes32'}
    ];

    

    before(async function(){
        accounts = await ethers.getSigners();
        const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
        forwarder = await Forwarder.deploy(await accounts[0].getAddress());
        await forwarder.deployed();
        const TestRecipient = await ethers.getContractFactory("TestRecipient");
        testRecipient = await TestRecipient.deploy(forwarder.address);
        await testRecipient.deployed();
    })

    describe("Calls", function(){
        /*it("doCall (to log gas)", async function(){
            for (i = 0; i < 20; i++){
                const tx = await testRecipient.connect(accounts[1]).doCall(await accounts[1].getAddress());
                const receipt = await tx.wait();
                console.log(receipt.gasUsed.toString())
            }
        })*/
        it("nada (to log gas)", async function(){
            await testRecipient.connect(accounts[0]).nada();
        })
    })

})