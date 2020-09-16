const { expect } = require("chai");

let domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];

let metaBuildType = [
  {name:"holder",type:"address"},
  {name:"authority",type:"address"},
  {name:"nonce",type:"uint256"}
];

let balancerForwarderType = [
  {name:"signer", type:"address"},
  {name:"to", type:"address"},
  {name:"data", type:"bytes"},
  {name:"value", type:"uint256"},
  {name:"inputToken", type:"address"},
  {name:"outputToken", type:"address"},
  {name:"nonce", type:"uint256"}
];

let metaBuildBasicSignature = ethers.utils.id("metaBuildWithBasicSign(address,address,Signature)").substr(0,10);

let mexaDSProxyFactory;
let balancerForwarder;
let mockActions;
let account0;
let account1;
let account2;
let proxy0;
let WETH;
let testToken;

describe("Biconomy DSProxy Contracts", function() {

  before(async function(){

    // Deploy WETH
    const _WETH9 = await ethers.getContractFactory("WETH9");
    WETH = await _WETH9.deploy();
    await WETH.deployed();

    // Deploy TestToken
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy(WETH.address);
    await testToken.deployed();

    // Deploy MockActions
    const MockActions = await ethers.getContractFactory("MockActions");
    mockActions = await MockActions.deploy(WETH.address,testToken.address);
    await mockActions.deployed();

    // Deploy BalancerForwarder
    const BalancerForwarder = await ethers.getContractFactory("BalancerForwarder");
    balancerForwarder = await BalancerForwarder.deploy();
    await balancerForwarder.deployed();

    // Deploy MexaDSProxyFactory
    const MexaDSProxyFactory = await ethers.getContractFactory("MexaDSProxyFactory");
    mexaDSProxyFactory = await MexaDSProxyFactory.deploy();
    await mexaDSProxyFactory.deployed();

    // Account1 setup
    [account0, account1, account2] = await ethers.getSigners();
    // - convert 90ETH into WETH
    await WETH.connect(account1).deposit({value:ethers.utils.parseEther("90")});
    // - approve BalancerForwarder to spend WETH
    await WETH.connect(account1).approve(balancerForwarder.address,ethers.utils.parseEther("90"));

  });

  it("MetaBuild",async function(){

    const factoryDomainData = {
      name : "MexaDSProxyFactory",
      version : "1",
      chainId : 42,
      verifyingContract : mexaDSProxyFactory.address
    };

    const dataToSign0 = {
      types: {
          EIP712Domain: domainType,
          MetaTransaction: metaBuildType
        },
        domain: factoryDomainData,
        primaryType: "MetaTransaction",
        message: {
          holder: await account1.getAddress(),
          authority: balancerForwarder.address,
          nonce: 0
        }
      };

    // - sign metaTx for MetaBuild(account1,BalancerForwarder)
    const metaBuildSig0 = await ethers.provider.send("eth_signTypedData",[await account1.getAddress(),dataToSign0]);
    const signature = metaBuildSig0.substring(2);
    const _r = "0x" + signature.substring(0, 64);
    const _s = "0x" + signature.substring(64, 128);
    const _v = parseInt(signature.substring(128, 130), 16);

    // - transmit it using account0
    const proxy0Deployment = await mexaDSProxyFactory.metaBuild(await account1.getAddress(), balancerForwarder.address, {v:_v,r:_r,s:_s});
    
    // gets the "Created" event made in the previous Tx where account1 is the owner. Uses this data to generate DSProxy object
    const proxy0Event = await mexaDSProxyFactory.queryFilter(
      mexaDSProxyFactory.filters.Created(null,await account1.getAddress(),null,null),
      proxy0Deployment.blockHash
      );
    const [proxy0Sender,proxy0Owner,proxy0Address,proxy0Cache] = proxy0Event[0].args
    proxy0 = await ethers.getContractAt("DSProxy",proxy0Address);

    // - check owner + authority are correct
    expect(await proxy0.owner()).to.equal(await account1.getAddress());
    expect(await proxy0.authority()).to.equal(balancerForwarder.address);
    
    // - sign metaTx for MetaBuild(account1,BalancerForwarder) INCORRECTLY (same nonce again)
    let wrongNonceFails = false;
    try{
      await mexaDSProxyFactory.metaBuild(await account1.getAddress(), balancerForwarder.address, {v:_v,r:_r,s:_s});
    }
    catch(error){
      wrongNonceFails = true;
    }
    expect(wrongNonceFails).to.equal(true);

    // - sign with wrong signer
    let wrongAccSignFails = false;
    try{
      const metaBuildSig1 = await ethers.provider.send("eth_signTypedData",[await account2.getAddress(),dataToSign]);
      const signature1 = metaBuildSig1.substring(2);
      const _r1 = "0x" + signature1.substring(0, 64);
      const _s1 = "0x" + signature1.substring(64, 128);
      const _v1 = parseInt(signature1.substring(128, 130), 16);
      await mexaDSProxyFactory.metaBuild(await account1.getAddress(), balancerForwarder.address, {v:_v1,r:_r1,s:_s1});
    }
    catch(error){
      wrongAccSignFails = true;
    }
    expect(wrongAccSignFails).to.equal(true);
  });

  it("MetaBuildWithBasicSign", async function(){

     // - sign metaTx for MetaBuildWithBasicSign(account1,BalancerForwarder) "\x19Ethereum Signed Message:\n32"
    const dataToSign1 = ethers.utils.solidityKeccak256(
        ["uint256","address","uint256","bytes4","address"],
        [0,mexaDSProxyFactory.address,42,metaBuildBasicSignature,balancerForwarder.address]
      );
      
    const metaBuildSig2 = await ethers.provider.send("eth_sign",[await account2.getAddress(),dataToSign1]);
    const signature2 = metaBuildSig2.substring(2);
    const _r2 = "0x" + signature2.substring(0, 64);
    const _s2 = "0x" + signature2.substring(64, 128);
    const _v2 = parseInt(signature2.substring(128, 130), 16);

    // - transmit it using account0
    const proxy1Deployment = await mexaDSProxyFactory.metaBuildWithBasicSign(
      await account2.getAddress(),balancerForwarder.address,{v:_v2,r:_r2,s:_s2});
    
    const proxy1Event = await mexaDSProxyFactory.queryFilter(
      mexaDSProxyFactory.filters.Created(null,await account2.getAddress(),null,null),
      proxy1Deployment.blockHash
      );
    
    const [proxy1Sender,proxy1Owner,proxy1Address,proxy1Cache] = proxy1Event[0].args
    const proxy1 = await ethers.getContractAt("DSProxy",proxy1Address);

    // - check owner + authority are correct
    expect(await proxy1.owner()).to.equal(await account2.getAddress());
    expect(await proxy1.authority()).to.equal(balancerForwarder.address);

    // - sign metaTx for MetaBuildWithBasicSign(account1,BalancerForwarder) INCORRECTLY (same nonce again)
    // - sign metaTx for MetaBuildWithBasicSign(account1,BalancerForwarder) INCORRECTLY (account0 signature)
    // - check second and third attempts fail
  });

  it("BalancerForwarder", async function(){
    // - build call data
    const forwarderDomainData = {
      name:"BalancerForwarder",
      version:"1",
      chainId:42,
      verifyingContract:balancerForwarder.address
    };

    const mockActionsCall = await mockActions.populateTransaction.joinPool(ethers.utils.parseEther("90"));
    const mockActionsData = mockActionsCall.data;
    const dsproxyExecCall = await proxy0.populateTransaction['execute(address,bytes)'](mockActions.address,mockActionsData);
    const dsproxyExecData = dsproxyExecCall.data;
    
    const dataToSign3 = {
      types: {
          EIP712Domain: domainType,
          MetaTransaction: balancerForwarderType
        },
        domain: forwarderDomainData,
        primaryType: "MetaTransaction",
        message: {
          signer: await account1.getAddress(),
          to: proxy0.address,
          data : dsproxyExecData,
          value: ethers.utils.parseEther("90").toString(),
          inputToken : WETH.address,
          outputToken : testToken.address,
          nonce: 0
        }
      };

      const metaBuildSig3 = await ethers.provider.send("eth_signTypedData",[await account1.getAddress(),dataToSign3]);
      const signature3 = metaBuildSig3.substring(2);
      const _r3 = "0x" + signature3.substring(0, 64);
      const _s3 = "0x" + signature3.substring(64, 128);
      const _v3 = parseInt(signature3.substring(128, 130), 16);
      await balancerForwarder.forward(await account1.getAddress(),{v:_v3,r:_r3,s:_s3},proxy0.address,dsproxyExecData,
      ethers.utils.parseEther("90"),WETH.address,testToken.address);


    // - sign metaTx for BalancerForwarder
    // - call BalancerForwarder with metaTx data using account 0
    // - check WETH and tokenB balances are correct
    // - sign metaTx INCORRECTLY (same nonce again)
    // - sign metaTx INCORRECTLY (account0 signature)
    // - check second and third attempts fail
  });

});
