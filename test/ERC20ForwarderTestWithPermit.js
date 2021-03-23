const { expect } = require("chai");
var abi = require("ethereumjs-abi");
const { ethers } = require("hardhat");

const salt = ethers.BigNumber.from(31337);

describe("ERC20Forwarder", function () {
  let accounts;
  let forwarder;
  let testRecipient;
  let domainData;
  let erc20Forwarder;
  let testnetDai;
  let testnetUSDC;
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

  let daiDomainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ];

  let daiPermitType = [
    { name: "holder", type: "address" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "allowed", type: "bool" },
  ];

  let eip2612PermitType = [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
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

    const TestnetDai = await ethers.getContractFactory("Dai");
    testnetDai = await TestnetDai.deploy(31337);
    await testnetDai.deployed();
    console.log(testnetDai.address);

    const TestnetUSDC = await ethers.getContractFactory("Token");
    testnetUsdc = await TestnetUSDC.deploy(
      "USDC Coin",
      "USDC",
      ethers.constants.MaxUint256
    );
    await testnetUsdc.deployed();
    console.log(testnetUsdc.address);

    //setup contracts
    realDai = await ethers.getContractAt(
      "contracts/6/interfaces/IERC20Permit.sol:IERC20Permit",
      "0x6b175474e89094c44da98b954eedeac495271d0f"
    );
    GUSD = await ethers.getContractAt(
      "contracts/5/token/erc20/IERC20.sol:IERC20",
      "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd"
    );
    USDC = await ethers.getContractAt(
      "contracts/6/interfaces/IERC20Permit.sol:IERC20Permit",
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
    await uniswapRouter.swapExactETHForTokens(
      0,
      [WETHAddress, realDai.address],
      await accounts[2].getAddress(),
      "10000000000000000000000",
      { value: ethers.utils.parseEther("1").toString() }
    );
    await uniswapRouter.swapExactETHForTokens(
      0,
      [WETHAddress, USDC.address],
      await accounts[2].getAddress(),
      "10000000000000000000000",
      { value: ethers.utils.parseEther("1").toString() }
    );

    console.log(
      "USDC Balance : " +
        (await USDC.balanceOf(await accounts[2].getAddress())).toString()
    );
    console.log(
      "USDC test Balance : " +
        (await testnetUsdc.balanceOf(await accounts[0].getAddress())).toString()
    );
    console.log(
      "Dai Balance : " +
        (await realDai.balanceOf(await accounts[2].getAddress())).toString()
    );

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
    await erc20Forwarder.initialize(
      await accounts[0].getAddress(),
      mockFeeManager.address,
      forwarder.address
    );

    await erc20Forwarder.setSafeTransferRequired(USDT.address, true);

    await testnetDai.mint(
      await accounts[1].getAddress(),
      ethers.utils.parseEther("1000")
    );
    await testnetDai.mint(
      await accounts[2].getAddress(),
      ethers.utils.parseEther("1000")
    );
    await testnetDai.mint(
      await accounts[5].getAddress(),
      ethers.utils.parseEther("1000")
    );

    await mockFeeManager.setTokenAllowed(realDai.address, true);
    await mockFeeManager.setTokenAllowed(USDC.address, true);
    await mockFeeManager.setTokenAllowed(USDT.address, true);
    await mockFeeManager.setTokenAllowed(GUSD.address, true);
    await mockFeeManager.setTokenAllowed(testnetDai.address, true);
    await mockFeeManager.setTokenAllowed(testnetUsdc.address, true);
  });

  describe("EIP712 Sign", function () {
    it("permit and executes call successfully with DAI", async function () {
      let permitOptions = {};
      let daiDomainData = {
        name: "Dai Stablecoin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetDai.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const allowed = true;
      const userAddress = await accounts[2].getAddress();
      const nonce = await testnetDai.nonces(userAddress);
      console.log("nonce" + nonce);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: daiPermitType,
        },
        domain: daiDomainData,
        primaryType: "Permit",
        message: {
          holder: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          expiry: parseInt(expiry),
          allowed: allowed,
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = 0; //in case of DAI passing dummy value for the sake of struct (similar to token address in EIP2771)
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[2].getAddress();
      req.batchNonce = 0;
      req.batchId = 0;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitAndExecuteEIP712(
        req,
        domainSeparator,
        sig,
        permitOptions
      );
      expect(await testnetDai.nonces(userAddress)).to.equal(1);
    });

    it("permit and executes call successfully with DAI", async function () {
      let permitOptions = {};
      let daiDomainData = {
        name: "Dai Stablecoin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetDai.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const allowed = true;
      const userAddress = await accounts[2].getAddress();
      const nonce = await testnetDai.nonces(userAddress);
      console.log("nonce" + nonce);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: daiPermitType,
        },
        domain: daiDomainData,
        primaryType: "Permit",
        message: {
          holder: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          expiry: parseInt(expiry),
          allowed: allowed,
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = 0; //in case of DAI passing dummy value for the sake of struct (similar to token address in EIP2771)
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[2].getAddress();
      req.batchNonce = 1;
      req.batchId = 0;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitAndExecuteEIP712(
        req,
        domainSeparator,
        sig,
        permitOptions
      );
      expect(await testnetDai.nonces(userAddress)).to.equal(2);
    });

    it("permit and executes call successfully with DAI", async function () {
      let permitOptions = {};
      let daiDomainData = {
        name: "Dai Stablecoin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetDai.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const allowed = true;
      const userAddress = await accounts[2].getAddress();
      const nonce = await testnetDai.nonces(userAddress);
      console.log("nonce" + nonce);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: daiPermitType,
        },
        domain: daiDomainData,
        primaryType: "Permit",
        message: {
          holder: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          expiry: parseInt(expiry),
          allowed: allowed,
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = 0; //in case of DAI passing dummy value for the sake of struct (similar to token address in EIP2771)
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[2].getAddress();
      req.batchNonce = 2;
      req.batchId = 0;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitAndExecuteEIP712(
        req,
        domainSeparator,
        sig,
        permitOptions
      );
      expect(await testnetDai.nonces(userAddress)).to.equal(3);
    });

    it("permit and executes call successfully with EIP2612 permit type tokens", async function () {
      //USDC

      let permitOptions = {};
      let usdcDomainData = {
        name: "USDC Coin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetUsdc.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const value = ethers.utils.parseEther("100").toString();
      const allowed = true; //in case of EIP2612 passing dummy value for the sake of struct (similar to token address in EIP2771)
      const userAddress = await accounts[0].getAddress();
      const nonce = await testnetUsdc.nonces(userAddress);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: eip2612PermitType,
        },
        domain: usdcDomainData,
        primaryType: "Permit",
        message: {
          owner: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          value: value,
          deadline: parseInt(expiry),
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = value;
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[0].getAddress();
      req.batchNonce = 0;
      req.batchId = 15;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetUsdc.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitEIP2612AndExecuteEIP712(
        req,
        domainSeparator,
        sig,
        permitOptions
      );
      expect(await testnetUsdc.nonces(userAddress)).to.equal(1);
    });

    it("permit and executes call successfully with EIP2612 permit type tokens", async function () {
      //USDC

      let permitOptions = {};
      let usdcDomainData = {
        name: "USDC Coin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetUsdc.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const value = ethers.utils.parseEther("100").toString();
      const allowed = true; //in case of EIP2612 passing dummy value for the sake of struct (similar to token address in EIP2771)
      const userAddress = await accounts[0].getAddress();
      const nonce = await testnetUsdc.nonces(userAddress);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: eip2612PermitType,
        },
        domain: usdcDomainData,
        primaryType: "Permit",
        message: {
          owner: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          value: value,
          deadline: parseInt(expiry),
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = value;
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[0].getAddress();
      req.batchNonce = 1;
      req.batchId = 15;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetUsdc.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitEIP2612AndExecuteEIP712(
        req,
        domainSeparator,
        sig,
        permitOptions
      );
      expect(await testnetUsdc.nonces(userAddress)).to.equal(2);
    });

    it("permit and executes call successfully with EIP2612 permit type tokens", async function () {
      //USDC

      let permitOptions = {};
      let usdcDomainData = {
        name: "USDC Coin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetUsdc.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const value = ethers.utils.parseEther("100").toString();
      const allowed = true; //in case of EIP2612 passing dummy value for the sake of struct (similar to token address in EIP2771)
      const userAddress = await accounts[0].getAddress();
      const nonce = await testnetUsdc.nonces(userAddress);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: eip2612PermitType,
        },
        domain: usdcDomainData,
        primaryType: "Permit",
        message: {
          owner: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          value: value,
          deadline: parseInt(expiry),
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = value;
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[0].getAddress();
      req.batchNonce = 2;
      req.batchId = 15;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetUsdc.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitEIP2612AndExecuteEIP712(
        req,
        domainSeparator,
        sig,
        permitOptions
      );
      expect(await testnetUsdc.nonces(userAddress)).to.equal(3);
    });
  });

  describe("EIP712 Sign With Gas Tokens", function () {
    it("permit and executes call successfully with DAI AND Burns Gas Tokens", async function () {
      let permitOptions = {};
      let daiDomainData = {
        name: "Dai Stablecoin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetDai.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const allowed = true;
      const userAddress = await accounts[5].getAddress();
      const nonce = await testnetDai.nonces(userAddress);
      console.log("nonce" + nonce);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: daiPermitType,
        },
        domain: daiDomainData,
        primaryType: "Permit",
        message: {
          holder: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          expiry: parseInt(expiry),
          allowed: allowed,
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = 0; //in case of DAI passing dummy value for the sake of struct (similar to token address in EIP2771)
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[5].getAddress();
      req.batchNonce = 0;
      req.batchId = 0;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      let gasTokens = 1;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitAndExecuteEIP712WithGasTokens(
        req,
        domainSeparator,
        sig,
        permitOptions,
        gasTokens
      );
      expect(await testnetDai.nonces(userAddress)).to.equal(1);
    });

    it("permit and executes call successfully with EIP2612 permit type tokens", async function () {
      //USDC

      let permitOptions = {};
      let usdcDomainData = {
        name: "USDC Coin",
        version: "1",
        chainId: 31337,
        verifyingContract: testnetUsdc.address,
      };
      const spender = erc20Forwarder.address;
      const expiry = Math.floor(Date.now() / 1000 + 3600);
      const value = ethers.utils.parseEther("100").toString();
      const allowed = true; //in case of EIP2612 passing dummy value for the sake of struct (similar to token address in EIP2771)
      const userAddress = await accounts[4].getAddress();
      const nonce = await testnetUsdc.nonces(userAddress);
      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: eip2612PermitType,
        },
        domain: usdcDomainData,
        primaryType: "Permit",
        message: {
          owner: userAddress,
          spender: spender,
          nonce: parseInt(nonce),
          value: value,
          deadline: parseInt(expiry),
        },
      };

      const result = await ethers.provider.send("eth_signTypedData", [
        userAddress,
        permitDataToSign,
      ]);
      console.log("success:" + result);
      const signature = result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      permitOptions.holder = userAddress;
      permitOptions.spender = spender;
      permitOptions.value = value;
      permitOptions.nonce = parseInt(nonce.toString());
      permitOptions.expiry = expiry;
      permitOptions.allowed = allowed;
      permitOptions.v = v;
      permitOptions.r = r;
      permitOptions.s = s;

      await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.nada();
      req.from = await accounts[0].getAddress();
      req.batchNonce = 0;
      req.batchId = 11;
      req.txGas = req.gasLimit.toNumber();
      req.tokenGasPrice = ethers.utils.parseUnits("20", "gwei").toString();
      req.deadline = 0;
      let gasTokens = 1;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetUsdc.address;

      const dataToSign = {
        types: {
          EIP712Domain: domainType,
          ERC20ForwardRequest: erc20ForwardRequest,
        },
        domain: domainData,
        primaryType: "ERC20ForwardRequest",
        message: req,
      };
      const sig = await ethers.provider.send("eth_signTypedData", [
        req.from,
        dataToSign,
      ]);
      console.log("signature" + sig);
      await erc20Forwarder.permitEIP2612AndExecuteEIP712WithGasTokens(
        req,
        domainSeparator,
        sig,
        permitOptions,
        gasTokens
      );
      expect(await testnetUsdc.nonces(userAddress)).to.equal(1);
    });
  });
});
