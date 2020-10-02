const { expect } = require("chai");
var abi = require('ethereumjs-abi');
const { toBuffer } = require( 'ethereumjs-util');
const walletUtils = require("../walletUtils");
const { psForwarderMakeTransaction } = require("../gsnSignUtils");

describe("ERC20FeeProxy", function () {

    let accounts;
    let forwarder;
    let testRecipient;
    let domainData;
    let requestTypeHash;
    let erc20ForwardRequestTypeHash;
    let erc20FeeProxy;
    let testnetDai;
    let mockFeeMultiplier;

    let domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" }
      ];
      
    let erc20ForwardRequestType = [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "gas", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "token", type: "address" },
        { name: "feeReceiver", type: "address" },
        { name: "feeMultiplierManager", type: "address" },
        { name: "price" , type: "uint256"},
        { name: "gasToCover", type : "uint256"}
      ];

    before(async function(){
        accounts = await ethers.getSigners();
        const Forwarder = await ethers.getContractFactory("PersonalSignForwarder");
        forwarder = await Forwarder.deploy();
        await forwarder.deployed();
        //make custom typehash for erc20 fee related suffix data
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

        const ERC20FeeProxy = await ethers.getContractFactory("ERC20FeeProxy");
        erc20FeeProxy = await ERC20FeeProxy.deploy(forwarder.address,100000);
        await erc20FeeProxy.deployed();

        //deploy testnet dai
        const TestnetDai = await ethers.getContractFactory("TestnetDAI");
        testnetDai = await TestnetDai.deploy();
        await testnetDai.deployed();
        await testnetDai.mint(await accounts[1].getAddress(),ethers.utils.parseEther("1000"));
        await testnetDai.connect(accounts[1]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));

        //deployFeeMultiplier
        const MockFeeMultiplier = await ethers.getContractFactory("MockFeeMultiplier");
        mockFeeMultiplier = await MockFeeMultiplier.deploy();
        await mockFeeMultiplier.deployed();
        await mockFeeMultiplier.setFeeMultiplier(15000);

    });

    it("Should work with EIP712 sign", async function(){
        const message = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
        message.from = await accounts[1].getAddress();
        message.nonce = 0;
        message.gas = (message.gasLimit).toNumber();
        message.value = 0;
        delete message.gasPrice;
        delete message.gasLimit;
        delete message.chainId;
        const req = {...message};
        message.data = ethers.utils.keccak256(message.data);
        message.token = testnetDai.address;
        message.feeReceiver = await accounts[0].getAddress();
        message.feeMultiplierManager = mockFeeMultiplier.address;
        message.price = 29000000000000;
        message.gasToCover = 250000;

        const dataToSign = {
            types: {
                EIP712Domain: domainType,
                ERC20ForwardRequest: erc20ForwardRequestType
              },
              domain: domainData,
              primaryType: "ERC20ForwardRequest",
              message: message
            };

        const result = await ethers.provider.send("eth_signTypedData",[message.from,dataToSign]);

        const domainSeperator = ethers.utils.keccak256((ethers.utils.defaultAbiCoder).
                            encode(['bytes32','bytes32','bytes32','uint256','address'],
                            [ethers.utils.id("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                            ethers.utils.id(domainData.name),
                            ethers.utils.id(domainData.version),domainData.chainId,domainData.verifyingContract]));

        const suffixData = (ethers.utils.defaultAbiCoder).encode(['address','address','address','uint256','uint256'],
                            [message.token,message.feeReceiver,message.feeMultiplierManager,message.price,message.gasToCover]);

        await erc20FeeProxy.erc20Execute(req,domainSeperator,erc20ForwardRequestTypeHash,suffixData,result);
        
        expect(await TestRecipient.callsMade(await accounts[1].getAddress())).to.equal(1);

    });

    it("Nonce should be updated correctly", async function(){
        expect(await erc20FeeProxy.getNonce(await accounts[1].getAddress())).to.equal(1);
    });

    it("Should work with personal sign", async function(){

    });

    it("execute should revert", async function(){

    });

})