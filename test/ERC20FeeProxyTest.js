const { expect } = require("chai");
var abi = require('ethereumjs-abi');

describe("ERC20FeeProxy", function () {

    let accounts;
    let forwarder;
    let testRecipient;
    let domainData;
    let erc20FeeProxy;
    let testnetDai;
    let mockFeeManager;
    let domainSeparator;
    let faucet;
    var req0;

    let domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
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
      forwarder = await Forwarder.deploy();
      await forwarder.deployed();

      const TestRecipient = await ethers.getContractFactory("TestRecipient");
      testRecipient = await TestRecipient.deploy(forwarder.address);
      await testRecipient.deployed();

      domainData = {
          name : "TestRecipient",
          version : "1",
          chainId : 42,
          verifyingContract : forwarder.address
        };

      await forwarder.registerDomainSeparator("TestRecipient","1");
      domainSeparator = ethers.utils.keccak256((ethers.utils.defaultAbiCoder).
                        encode(['bytes32','bytes32','bytes32','uint256','address'],
                               [ethers.utils.id("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                               ethers.utils.id(domainData.name),ethers.utils.id(domainData.version),
                               domainData.chainId,domainData.verifyingContract]));
      
      const TestnetDai = await ethers.getContractFactory("TestnetDAI");
      testnetDai = await TestnetDai.deploy();
      await testnetDai.deployed();

      //deploy fee multiplier with a factor of 1.5x
      //deploy fee manager with a factor of 1.5x
      const MockFeeManager = await ethers.getContractFactory("MockFeeManager");
      mockFeeManager = await MockFeeManager.deploy(15000);
      await mockFeeManager.deployed();

      //deploy and fill up faucet
      const Faucet = await ethers.getContractFactory("mockFaucet");
      faucet = await Faucet.deploy();
      await faucet.deployed();
      await accounts[0].sendTransaction({value:ethers.utils.parseEther("100"),to:faucet.address});

      const ERC20FeeProxy = await ethers.getContractFactory("ERC20FeeProxy");
      erc20FeeProxy = await ERC20FeeProxy.deploy(100000, await accounts[0].getAddress(), mockFeeManager.address, forwarder.address);
      await erc20FeeProxy.deployed();

      await testnetDai.mint(await accounts[1].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.mint(await accounts[2].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.mint(await accounts[3].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[1]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[2]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[3]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));

    });

    describe("Personal Sign", function(){

      it("executes call successfully", async function(){
        const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
        req.from = await accounts[1].getAddress();
        req.batchNonce = 0;
        req.batchId = 0;
        req.txGas = (req.gasLimit).toNumber();
        req.tokenGasPrice = (ethers.utils.parseUnits('20000','gwei')).toString();
        req.deadline = 0;
        delete req.gasPrice;
        delete req.gasLimit;
        delete req.chainId;
        req.token = testnetDai.address;
        const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                            [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                             ethers.utils.keccak256(req.data)]);
        const sig = await accounts[1].signMessage(hashToSign);
        await erc20FeeProxy.executePersonalSign(req,sig);
        expect(await testRecipient.callsMade(req.from)).to.equal(1);
        req0=req;
    });

    it("Updates nonces", async function(){
        expect(await erc20FeeProxy.getNonce(await accounts[1].getAddress(),0)).to.equal(1);
    });

    it("Only pays relayers for the amount of gas used", async function(){
        const expectedMax = (ethers.BigNumber.from(req0.txGas*1.5)).mul(ethers.BigNumber.from(req0.tokenGasPrice));//gas*price*1.5
        expect((await testnetDai.balanceOf(await accounts[0].getAddress())).lt(expectedMax)).to.equal(true);
    });

    it("Fails when nonce invalid", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
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
      await expect(erc20FeeProxy.executePersonalSign(req,sig)).to.be.revertedWith();
    });

    it("Fails when signer invalid", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
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
      await expect(erc20FeeProxy.executePersonalSign(req,sig)).to.be.revertedWith();
    });

    });

  describe("EIP712", function(){

    it("executes call successfully", async function(){
      await erc20FeeProxy.setFeeReceiver(await accounts[4].getAddress());
      const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
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
      const erc20fr = Object.assign({}, req);
      erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
      delete erc20fr.data;
      const dataToSign = {
          types: {
              EIP712Domain: domainType,
              ERC20ForwardRequest: erc20ForwardRequest
            },
            domain: domainData,
            primaryType: "ERC20ForwardRequest",
            message: erc20fr
          };
      const sig = await ethers.provider.send("eth_signTypedData",[req.from,dataToSign]);
      await erc20FeeProxy.executeEIP712(req,domainSeparator,sig);
      expect(await testRecipient.callsMade(req.from)).to.equal(1);
      req0=req;
  });

  it("Updates nonces", async function(){
      expect(await erc20FeeProxy.getNonce(await accounts[2].getAddress(),0)).to.equal(1);
  });

  it("Only pays relayers for the amount of gas used", async function(){
    const expectedMax = (ethers.BigNumber.from(req0.txGas*1.5)).mul(ethers.BigNumber.from(req0.tokenGasPrice));//gas*price*1.5
    expect((await testnetDai.balanceOf(await accounts[4].getAddress())).lt(expectedMax)).to.equal(true);
  });

  it("Fails when nonce invalid", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
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
      const erc20fr = Object.assign({}, req);
      erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
      delete erc20fr.data;
      const dataToSign = {
          types: {
              EIP712Domain: domainType,
              ERC20ForwardRequest: erc20ForwardRequest
            },
            domain: domainData,
            primaryType: "ERC20ForwardRequest",
            message: erc20fr
          };
      const sig = await ethers.provider.send("eth_signTypedData",[req.from,dataToSign]);;
      await expect(erc20FeeProxy.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
  });

  it("Fails when signer invalid", async function(){
    const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
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
    const erc20fr = Object.assign({}, req);
    erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
    delete erc20fr.data;
    const dataToSign = {
        types: {
            EIP712Domain: domainType,
            ERC20ForwardRequest: erc20ForwardRequest
          },
          domain: domainData,
          primaryType: "ERC20ForwardRequest",
          message: erc20fr
        };
    const sig = await ethers.provider.send("eth_signTypedData",[await accounts[0].getAddress(),dataToSign]);
    await expect(erc20FeeProxy.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
  });

  });

  describe("Fee Transfer Handler", function(){
    it("fee handler charges based on gas used, not req.gas", async function(){
      await erc20FeeProxy.setFeeReceiver(await accounts[5].getAddress());
      const req = await testRecipient.populateTransaction.doCall(await accounts[3].getAddress());
      req.from = await accounts[3].getAddress();
      req.batchNonce = 0;
      req.batchId = 0;
      req.txGas = (req.gasLimit).toNumber();
      req.tokenGasPrice = (ethers.utils.parseUnits('20000','gwei')).toString();
      req.deadline = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                            ethers.utils.keccak256(req.data)]);
      const sig = await accounts[3].signMessage(hashToSign);
      await erc20FeeProxy.executePersonalSign(req,sig);
      expect(await testRecipient.callsMade(req.from)).to.equal(1);
      const expectedMax = (ethers.BigNumber.from(req.txGas*1.5)).mul(ethers.BigNumber.from(req.tokenGasPrice));//gas*price*1.5
      expect((await testnetDai.balanceOf(await accounts[5].getAddress())).lt(expectedMax)).to.equal(true);
  });

  it("fee handler considers price correctly", async function(){
    const price0 = (ethers.utils.parseUnits('1','gwei')).toString();
    const price1 = (ethers.utils.parseUnits('2','gwei')).toString();

    await erc20FeeProxy.setFeeReceiver(await accounts[6].getAddress());
    const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
    req.from = await accounts[1].getAddress();
    req.batchNonce = 0;
    req.batchId = 2;
    req.txGas = (req.gasLimit).toNumber();
    req.tokenGasPrice = price0;
    req.deadline = 0;
    delete req.gasPrice;
    delete req.gasLimit;
    delete req.chainId;
    req.token = testnetDai.address;
    const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                        [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                          ethers.utils.keccak256(req.data)]);
    const sig = await accounts[1].signMessage(hashToSign);
    await erc20FeeProxy.executePersonalSign(req,sig);
    const amountSpent = await testnetDai.balanceOf(await accounts[6].getAddress());

    await erc20FeeProxy.setFeeReceiver(await accounts[7].getAddress());
    const req1 = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
    req1.from = await accounts[1].getAddress();
    req1.batchNonce = 0;
    req1.batchId = 3;
    req1.txGas = (req1.gasLimit).toNumber();
    req1.tokenGasPrice = price1;
    req1.deadline = 0;
    delete req1.gasPrice;
    delete req1.gasLimit;
    delete req1.chainId;
    req1.token = testnetDai.address;
    const hashToSign1 = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                        [req1.from,req1.to,req1.token,req1.txGas,req1.tokenGasPrice,req1.batchId,req1.batchNonce,req1.deadline,
                                          ethers.utils.keccak256(req1.data)]);
    const sig1 = await accounts[1].signMessage(hashToSign1);
    await erc20FeeProxy.executePersonalSign(req1,sig1);
    const amountSpent1 = await testnetDai.balanceOf(await accounts[7].getAddress());
    const expectedMax1 = (ethers.BigNumber.from(req1.txGas*1.5)).mul(ethers.BigNumber.from(req1.tokenGasPrice));//gas*price*1.5

    expect((amountSpent1).lt(expectedMax1)).to.equal(true);
    expect(Math.round(amountSpent1.toNumber()/amountSpent.toNumber())).to.equal(2);
  });

  it("fee handler considers multiplier correctly", async function(){
    
    const price0 = (ethers.utils.parseUnits('1','gwei')).toString();

    await erc20FeeProxy.setFeeReceiver(await accounts[8].getAddress());
    const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
    req.from = await accounts[1].getAddress();
    req.batchNonce = 0;
    req.batchId = 4;
    req.txGas = (req.gasLimit).toNumber();
    req.tokenGasPrice = price0;
    req.deadline = 0;
    delete req.gasPrice;
    delete req.gasLimit;
    delete req.chainId;
    req.token = testnetDai.address;
    const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                        [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                          ethers.utils.keccak256(req.data)]);
    const sig = await accounts[1].signMessage(hashToSign);
    await erc20FeeProxy.executePersonalSign(req,sig);
    const amountSpent = await testnetDai.balanceOf(await accounts[8].getAddress());

    await erc20FeeProxy.setFeeReceiver(await accounts[9].getAddress());
    await mockFeeManager.setFeeMultiplier(30000);
    const req1 = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
    req1.from = await accounts[1].getAddress();
    req1.batchNonce = 0;
    req1.batchId = 5;
    req1.txGas = (req1.gasLimit).toNumber();
    req1.tokenGasPrice = price0;
    req1.deadline = 0;
    delete req1.gasPrice;
    delete req1.gasLimit;
    delete req1.chainId;
    req1.token = testnetDai.address;
    const hashToSign1 = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                        [req1.from,req1.to,req1.token,req1.txGas,req1.tokenGasPrice,req1.batchId,req1.batchNonce,req1.deadline,
                                          ethers.utils.keccak256(req1.data)]);
    const sig1 = await accounts[1].signMessage(hashToSign1);
    await erc20FeeProxy.executePersonalSign(req1,sig1);
    const amountSpent1 = await testnetDai.balanceOf(await accounts[9].getAddress());
    const expectedMax1 = (ethers.BigNumber.from(req1.txGas*3)).mul(ethers.BigNumber.from(req1.tokenGasPrice));//gas*price*3
    expect((amountSpent1).lt(expectedMax1)).to.equal(true);
    expect(Math.round(amountSpent1.toNumber()/amountSpent.toNumber())).to.equal(2);
  });

  it("transfers from correct address", async function(){
    const price0 = (ethers.utils.parseUnits('1','gwei')).toString();

    await erc20FeeProxy.setFeeReceiver(await accounts[5].getAddress());
    const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
    req.from = await accounts[1].getAddress();
    req.batchNonce = 0;
    req.batchId = 6;
    req.txGas = (req.gasLimit).toNumber();
    req.tokenGasPrice = price0;
    req.deadline = 0;
    delete req.gasPrice;
    delete req.gasLimit;
    delete req.chainId;
    req.token = testnetDai.address;
    const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                        [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                          ethers.utils.keccak256(req.data)]);
    const sig = await accounts[1].signMessage(hashToSign);
    const balance0 = await testnetDai.balanceOf(await accounts[1].getAddress());
    await erc20FeeProxy.executePersonalSign(req,sig);
    const balance1 = await testnetDai.balanceOf(await accounts[1].getAddress());
    expect((balance1).lt(balance0)).to.equal(true);
});

it("transfer handler gas amount added correctly to total gas charged", async function(){
  const price0 = (ethers.utils.parseUnits('1','gwei')).toString();

  await erc20FeeProxy.setFeeReceiver(await accounts[10].getAddress());
  const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
  req.from = await accounts[1].getAddress();
  req.batchNonce = 0;
  req.batchId = 7;
  req.txGas = (req.gasLimit).toNumber();
  req.tokenGasPrice = price0;
  req.deadline = 0;
  delete req.gasPrice;
  delete req.gasLimit;
  delete req.chainId;
  req.token = testnetDai.address;
  const hashToSign = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                      [req.from,req.to,req.token,req.txGas,req.tokenGasPrice,req.batchId,req.batchNonce,req.deadline,
                                        ethers.utils.keccak256(req.data)]);
  const sig = await accounts[1].signMessage(hashToSign);
  await erc20FeeProxy.executePersonalSign(req,sig);
  const amountSpent = await testnetDai.balanceOf(await accounts[10].getAddress());

  await erc20FeeProxy.setTransferHandlerGas(0);

  await erc20FeeProxy.setFeeReceiver(await accounts[11].getAddress());
  const req1 = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
  req1.from = await accounts[1].getAddress();
  req1.batchNonce = 0;
  req1.batchId = 8;
  req1.txGas = (req1.gasLimit).toNumber();
  req1.tokenGasPrice = price0;
  req1.deadline = 0;
  delete req1.gasPrice;
  delete req1.gasLimit;
  delete req1.chainId;
  req1.token = testnetDai.address;
  const hashToSign1 = abi.soliditySHA3(['address','address','address','uint256','uint256','uint256','uint256','uint256','bytes32'],
                                      [req1.from,req1.to,req1.token,req1.txGas,req1.tokenGasPrice,req1.batchId,req1.batchNonce,req1.deadline,
                                        ethers.utils.keccak256(req1.data)]);
  const sig1 = await accounts[1].signMessage(hashToSign1);
  await erc20FeeProxy.executePersonalSign(req1,sig1);
  const amountSpent1 = await testnetDai.balanceOf(await accounts[11].getAddress());
  const expectedDifference = (ethers.BigNumber.from(300000)).mul(ethers.BigNumber.from(req1.tokenGasPrice));
  expect((amountSpent1).lt(amountSpent)).to.equal(true);
  expect((((amountSpent.sub(expectedDifference)).sub(amountSpent1)).abs()).lte(amountSpent1.div(ethers.BigNumber.from(100)))).to.equal(true);
});

it("Reverts requests which use non-permitted tokens", async function(){
  await mockFeeManager.setTokenBan(testnetDai.address,true);
  const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
  req.from = await accounts[1].getAddress();
  req.batchNonce = 0;
  req.batchId = 9;
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
  await expect(erc20FeeProxy.executePersonalSign(req,sig)).to.be.revertedWith();
});
    //transfer handler gas amount added correctly to total gas charged
    //transfers from correct token - validated implicitly from the other tests working
    //transfers to correct address - when feeReceiver changed - validated implicitly from the other tests working
    //transfers from correct address
    //prevents transfers from banned tokens
  });

})