const { expect } = require("chai");
var abi = require('ethereumjs-abi');

const salt = ethers.BigNumber.from(31337);

describe("ERC20ForwarderProxy", function () {
  let accounts;
  let forwarder;
  let testRecipient;
  let domainData;
  let erc20Forwarder;
  let mockErc20Forwarder;
  let erc20ForwarderProxy;
  let testProxy;
  let testnetDai;
  let mockFeeManager;
  let domainSeparator;
  let faucet;
  var req0;
  let uniswapRouter;
  let realDai;
  let GUSD;
  let USDC;
  let USDT;
  let WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  let domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" },
  ];

  let erc20ForwardRequest = [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "token", type: "address" },
    { name: "txGas", type: "uint256" },
    { name: "tokenGasPrice", type: "uint256" },
    { name: "batchId", type: "uint256" },
    { name: "batchNonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "data", type: "bytes" },
  ];

  before(async function () {
    accounts = await ethers.getSigners();

    const TestnetDai = await ethers.getContractFactory("TestnetDAI");
    testnetDai = await TestnetDai.deploy();
    await testnetDai.deployed();

    //setup contracts
    realDai = await ethers.getContractAt(
      "contracts/5/token/erc20/IERC20.sol:IERC20",
      "0x6b175474e89094c44da98b954eedeac495271d0f"
    );
    GUSD = await ethers.getContractAt(
      "contracts/5/token/erc20/IERC20.sol:IERC20",
      "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd"
    );
    USDC = await ethers.getContractAt(
      "contracts/5/token/erc20/IERC20.sol:IERC20",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    );
    USDT = await ethers.getContractAt(
      "contracts/5/token/erc20/IERC20.sol:IERC20",
      "0xdac17f958d2ee523a2206206994597c13d831ec7"
    );

    uniswapRouter = await ethers.getContractAt(
      "IUniswapV2Router02",
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );

    //fill account 0
    //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
    //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,GUSD.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("10").toString()});
    //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});

    //console.log("USDC Balance : "+(await USDC.balanceOf(await accounts[0].getAddress())).toString());
    //console.log("Dai Balance : "+(await realDai.balanceOf(await accounts[0].getAddress())).toString());

    const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
    forwarder = await Forwarder.deploy(await accounts[0].getAddress());
    await forwarder.deployed();

    const TestRecipient = await ethers.getContractFactory("TestRecipient");
    testRecipient = await TestRecipient.deploy(forwarder.address);
    await testRecipient.deployed();

    domainData = {
      name: "TestRecipient",
      version: "1",
      verifyingContract: forwarder.address,
      salt: ethers.utils.hexZeroPad(salt.toHexString(), 32)
    };

    await forwarder.registerDomainSeparator("TestRecipient", "1");
    domainSeparator = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
        [
          ethers.utils.id(
            "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
          ),
          ethers.utils.id(domainData.name),
          ethers.utils.id(domainData.version),
          domainData.verifyingContract,
          domainData.salt,
        ]
      )
    );

    //deploy fee multiplier with a factor of 1.5x
    //deploy fee manager with a factor of 1.5x
    const MockFeeManager = await ethers.getContractFactory("MockFeeManager");
    mockFeeManager = await MockFeeManager.deploy(15000);
    await mockFeeManager.deployed();

    //deploy and fill up faucet
    const Faucet = await ethers.getContractFactory("mockFaucet");
    faucet = await Faucet.deploy();
    await faucet.deployed();
    await accounts[0].sendTransaction({
      value: ethers.utils.parseEther("100"),
      to: faucet.address,
    });

    const ERC20Forwarder = await ethers.getContractFactory("ERC20Forwarder");
    erc20Forwarder = await ERC20Forwarder.deploy(
      await accounts[0].getAddress()
    );
    await erc20Forwarder.deployed();
    
    mockErc20Forwarder = await ERC20Forwarder.deploy(
      await accounts[1].getAddress()
    );
    await mockErc20Forwarder.deployed();


    const ERC20ForwarderProxy = await hre.ethers.getContractFactory(
      "ERC20ForwarderProxy"
    );
    erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(
      erc20Forwarder.address,
      await accounts[2].getAddress(),
      await accounts[0].getAddress()
    );
    await erc20ForwarderProxy.deployed();

    testProxy = await ethers.getContractAt(
      "contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder",
      erc20ForwarderProxy.address
    );
    await testProxy.initialize(
      await accounts[0].getAddress(),
      mockFeeManager.address,
      forwarder.address
    );

     //set transfer handler gas
     await testProxy.setTransferHandlerGas(testnetDai.address,37605); //values to be tuned further
    
 
     await testProxy.setTransferHandlerGas(USDT.address,41672);
     
 
     await testProxy.setTransferHandlerGas(USDC.address,42944);
     
 
 
     //set safe transfer required
     await testProxy.setSafeTransferRequired(USDT.address,true);
 

    await testnetDai.mint(
      await accounts[1].getAddress(),
      ethers.utils.parseEther("1000")
    );
    await testnetDai.mint(
      await accounts[2].getAddress(),
      ethers.utils.parseEther("1000")
    );
    await testnetDai.mint(
      await accounts[3].getAddress(),
      ethers.utils.parseEther("1000")
    );
    await testnetDai
      .connect(accounts[1])
      .approve(erc20ForwarderProxy.address, ethers.utils.parseEther("1000"));
    await testnetDai
      .connect(accounts[2])
      .approve(erc20ForwarderProxy.address, ethers.utils.parseEther("1000"));
    await testnetDai
      .connect(accounts[3])
      .approve(erc20ForwarderProxy.address, ethers.utils.parseEther("1000"));
    await realDai.approve(
      erc20ForwarderProxy.address,
      ethers.utils.parseEther("1000")
    );
    await USDC.approve(erc20ForwarderProxy.address, ethers.utils.parseEther("1000"));
    await GUSD.approve(erc20ForwarderProxy.address, ethers.utils.parseEther("1000"));
    await USDT.approve(erc20ForwarderProxy.address, ethers.utils.parseEther("1000"));

    await mockFeeManager.setTokenAllowed(realDai.address, true);
    await mockFeeManager.setTokenAllowed(USDC.address, true);
    await mockFeeManager.setTokenAllowed(USDT.address, true);
    await mockFeeManager.setTokenAllowed(GUSD.address, true);
    await mockFeeManager.setTokenAllowed(testnetDai.address, true);
  });

  describe("Personal Sign", function(){

      it("executes call successfully", async function(){
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        const req = await testRecipient.populateTransaction.nada();
        req.from = await accounts[1].getAddress();
        req.batchNonce = 0;
        req.batchId = 0;
        req.txGas = (req.gasLimit).toNumber();
        req.tokenGasPrice = (ethers.utils.parseUnits('200','gwei')).toString();
        req.deadline = 0;
        delete req.gasPrice;
        delete req.gasLimit;
        delete req.chainId;
        req.token = testnetDai.address;
        const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                            [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                             ethers.utils.keccak256(req.data)]);
        const sig = await accounts[1].signMessage(hashToSign);
        await testProxy.executePersonalSign(req,sig);
        //expect(await testRecipient.callsMade(req.from)).to.equal(1);
        req0=req;
    });

    it("Updates nonces", async function(){
        expect(await testProxy.getNonce(await accounts[1].getAddress(),0)).to.equal(1);
    });


    it("Fails when nonce invalid", async function(){
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[1].getAddress();
      req.batchNonce = 0;
      req.batchId = 0;
      req.txGas = (req.gasLimit).toNumber();
      req.tokenGasPrice = 0;
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                              ethers.utils.keccak256(req.data)]);
      const sig = await accounts[1].signMessage(hashToSign);
      await expect(testProxy.executePersonalSign(req,sig)).to.be.revertedWith();
    });

    it("Fails when signer invalid", async function(){
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[1].getAddress();
      req.batchNonce = 0;
      req.batchId = 0;
      req.txGas = (req.gasLimit).toNumber();
      req.tokenGasPrice = 0;
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                              ethers.utils.keccak256(req.data)]);
      const sig = await accounts[0].signMessage(hashToSign);
      await expect(testProxy.executePersonalSign(req,sig)).to.be.revertedWith();
    });

    });

  describe("EIP712", function(){

    it("executes call successfully", async function(){
      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[2].getAddress();
      req.batchNonce = 0;
      req.batchId = 0;
      req.txGas = (req.gasLimit).toNumber();
      req.tokenGasPrice = (ethers.utils.parseUnits('20','gwei')).toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      // const erc20fr = Object.assign({}, req);
      // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
      // delete erc20fr.data;
      const dataToSign = {
          types: {
              EIP712Domain: domainType,
              ERC20ForwardRequest: erc20ForwardRequest
            },
            domain: domainData,
            primaryType: "ERC20ForwardRequest",
            message: req
          };
      const sig = await ethers.provider.send("eth_signTypedData",[req.from,dataToSign]);
      await testProxy.executeEIP712(req,domainSeparator,sig);
      //expect(await testRecipient.callsMade(req.from)).to.equal(1);
      req0=req;
  });

  it("Updates nonces", async function(){
      expect(await testProxy.getNonce(await accounts[2].getAddress(),0)).to.equal(1);
  });


  it("Fails when nonce invalid", async function(){
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[2].getAddress();
      req.batchNonce = 0;
      req.batchId = 0;
      req.txGas = (req.gasLimit).toNumber();
      req.tokenGasPrice = (ethers.utils.parseUnits('20000','gwei')).toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      // const erc20fr = Object.assign({}, req);
      // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
      // delete erc20fr.data;
      const dataToSign = {
          types: {
              EIP712Domain: domainType,
              ERC20ForwardRequest: erc20ForwardRequest
            },
            domain: domainData,
            primaryType: "ERC20ForwardRequest",
            message: req
          };
      const sig = await ethers.provider.send("eth_signTypedData",[req.from,dataToSign]);;
      await expect(testProxy.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
  });

  it("Fails when signer invalid", async function(){
    const req = await testRecipient.populateTransaction.nada();
    req.from = await accounts[2].getAddress();
    req.batchNonce = 0;
    req.batchId = 1;
    req.txGas = (req.gasLimit).toNumber();
    req.tokenGasPrice = (ethers.utils.parseUnits('20000','gwei')).toString();
    req.deadline = 0;
    delete req.gasPrice;
    delete req.gasLimit;
    delete req.chainId;
    req.token = testnetDai.address;
    // const erc20fr = Object.assign({}, req);
    // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
    // delete erc20fr.data;
    const dataToSign = {
        types: {
            EIP712Domain: domainType,
            ERC20ForwardRequest: erc20ForwardRequest
          },
          domain: domainData,
          primaryType: "ERC20ForwardRequest",
          message: req
        };
    const sig = await ethers.provider.send("eth_signTypedData",[await accounts[0].getAddress(),dataToSign]);
    await expect(testProxy.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
  });

  });

  describe("Upgradeablility", function () {
   
    it("admin can set another admin", async function () {
      const oldAdmin = await erc20ForwarderProxy.admin();
      await erc20ForwarderProxy.connect(accounts[2]).changeAdmin(await accounts[0].getAddress());
      const newAdmin = await erc20ForwarderProxy.admin();
      expect(newAdmin == (await accounts[0].getAddress())).to.equal(true);
    });


    it("admin can upgrade implementation address to another contract address", async function () {
      const impl_address = await erc20ForwarderProxy.implementation();
      console.log(`old imeplementation address = ${impl_address}`);
      const newImplementation = mockErc20Forwarder.address;
      await erc20ForwarderProxy.upgradeTo(newImplementation);
      const updatedImplementation = await erc20ForwarderProxy.implementation();
      expect(updatedImplementation == newImplementation).to.equal(true);
    });

    it("unauthorized user can not upgrade implementation address", async function () {
      //admin is account 0 now
      const impl_address = await erc20ForwarderProxy.implementation();
      console.log(`old imeplementation address = ${impl_address}`);
      const newImplementation = erc20Forwarder.address;
      await expect(erc20ForwarderProxy.connect(accounts[2]).upgradeTo(newImplementation)).to.be.revertedWith();
    });

    /**
     * Upgrade the backing implementation of the proxy and call a function
     * on the new implementation.
     * This is useful to initialize the proxied contract. 
     */

    /*it("admin can upgrade implementation address and call method", async function () {
      await erc20ForwarderProxy.upgradeTo(erc20Forwarder.address);
      const newImplementation = mockErc20Forwarder.address;
      const proxyCall = await testProxy.populateTransaction.initialize(
        await accounts[0].getAddress(),
        mockFeeManager.address,
        forwarder.address
      );
      await erc20ForwarderProxy.upgradeToAndCall(newImplementation,proxyCall.data);
    });*/

   
  });

  describe("proxy forwarding", function () {
    it("Only fall back when the sender is not the admin", async function () {
      await erc20ForwarderProxy.upgradeTo(erc20Forwarder.address);
      await expect(testProxy.setSafeTransferRequired(USDT.address,false)).to.be.revertedWith();

      //await erc20Forwarder.transferOwnership(await accounts[1].getAddress());
      //await testProxy.connect(accounts[0]).setSafeTransferRequired(USDT.address,false);
      //Cannot call fallback function from the proxy admin
    });

});

});