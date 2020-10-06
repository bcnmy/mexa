const { expect } = require("chai");
var abi = require('ethereumjs-abi');

describe("ERC20FeeProxy", function () {

    let accounts;
    let forwarder;
    let testRecipient;
    let domainData;
    let erc20FeeProxy;
    let testnetDai;
    let mockFeeMultiplier;
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
        {name:'feeReceiver',type:'address'},
        {name:'feeMultiplierManager',type:'address'},
        {name:'msgValue', type:'uint256'},
        {name:'gas',type:'uint256'},
        {name:'price',type:'uint256'},
        {name:'nonce',type:'uint256'},
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
      const MockFeeMultiplier = await ethers.getContractFactory("MockFeeMultiplier");
      mockFeeMultiplier = await MockFeeMultiplier.deploy();
      await mockFeeMultiplier.deployed();
      await mockFeeMultiplier.setFeeMultiplier(15000);

      //deploy and fill up faucet
      const Faucet = await ethers.getContractFactory("mockFaucet");
      faucet = await Faucet.deploy();
      await faucet.deployed();
      await accounts[0].sendTransaction({value:ethers.utils.parseEther("100"),to:faucet.address});

      const ERC20FeeProxy = await ethers.getContractFactory("ERC20FeeProxy");
      erc20FeeProxy = await ERC20FeeProxy.deploy(forwarder.address,100000);
      await erc20FeeProxy.deployed();

      await testnetDai.mint(await accounts[1].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.mint(await accounts[2].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[1]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[2]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));

    });

    describe("Personal Sign", function(){

      it("executes call successfully", async function(){
        const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
        req.from = await accounts[1].getAddress();
        req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
        req.gas = 250000;
        req.price = (ethers.utils.parseUnits('20000','gwei')).toString();
        req.msgValue = 0;
        delete req.gasPrice;
        delete req.gasLimit;
        delete req.chainId;
        req.token = testnetDai.address;
        req.feeReceiver = await accounts[0].getAddress();
        req.feeMultiplierManager = mockFeeMultiplier.address;
        const hashToSign = abi.soliditySHA3(['address','address','address','address','address',
                                             'uint256','uint256','uint256','uint256','bytes32'],
                                            [req.from,req.to,req.token,req.feeReceiver,req.feeMultiplierManager,
                                             req.msgValue,req.gas,req.price,req.nonce,ethers.utils.keccak256(req.data)]);
        const sig = await accounts[1].signMessage(hashToSign);
        await erc20FeeProxy.executePersonalSign(req,sig);
        expect(await testRecipient.callsMade(req.from)).to.equal(1);
        req0=req;
    });

    it("Updates nonces", async function(){
        expect(await forwarder.getNonce(await accounts[1].getAddress())).to.equal(1);
    });

    it("Only pays relayers for the amount of gas used", async function(){
        const expectedMax = (ethers.BigNumber.from(req0.gas*1.5)).mul(ethers.BigNumber.from(req0.price));//gas*price*1.5
        expect((await testnetDai.balanceOf(await accounts[0].getAddress())).lt(expectedMax)).to.equal(true);
    });

    it("Transfers the correct value when msgValue is non zero", async function(){
      //creates random wallet (so we can guarantee balance is zero)
      const rwallet = ethers.Wallet.createRandom();
      const req = {to:await rwallet.getAddress(),data:'0x'} 
      req.from = await accounts[1].getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = 21000;
      req.price = 0;
      req.msgValue = (ethers.utils.parseEther("1")).toString();
      req.data = req.data;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','address','address',
                                           'uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.feeReceiver,req.feeMultiplierManager,
                                           req.msgValue,req.gas,req.price,req.nonce,ethers.utils.keccak256(req.data)]);
      const sig = await accounts[1].signMessage(hashToSign);
      await erc20FeeProxy.executePersonalSign(req,sig,{value:req.msgValue});
      expect((await ethers.provider.getBalance(req.to)).toString()).to.equal(req.msgValue);
    });

    it("Transfers any funds received to the 'from address'", async function(){
      const rwallet = ethers.Wallet.createRandom();
      const req = await faucet.populateTransaction.payUp(forwarder.address,(ethers.utils.parseEther("1")).toString());
      req.from = await rwallet.getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = 21000;
      req.price = 0;
      req.msgValue = 0;
      req.data = req.data;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','address','address',
                                           'uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.feeReceiver,req.feeMultiplierManager,
                                           req.msgValue,req.gas,req.price,req.nonce,ethers.utils.keccak256(req.data)]);
      const sig = await rwallet.signMessage(hashToSign);
      await erc20FeeProxy.executePersonalSign(req,sig);
      expect((await ethers.provider.getBalance(req.from)).toString()).to.equal(ethers.utils.parseEther("1"));
    });

    it("Fails when nonce invalid", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
      req.from = await accounts[1].getAddress();
      req.nonce = 0;
      req.gas = (req.gasLimit).toNumber();
      req.price = 0;
      req.msgValue = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','address','address',
                                           'uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.feeReceiver,req.feeMultiplierManager,
                                           req.msgValue,req.gas,req.price,req.nonce,ethers.utils.keccak256(req.data)]);
      const sig = await accounts[1].signMessage(hashToSign);
      await expect(erc20FeeProxy.executePersonalSign(req,sig)).to.be.revertedWith();
    });

    it("Fails when signer invalid", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
      req.from = await accounts[1].getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = (req.gasLimit).toNumber();
      req.price = 0;
      req.msgValue = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','address','address',
                                           'uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.feeReceiver,req.feeMultiplierManager,
                                           req.msgValue,req.gas,req.price,req.nonce,ethers.utils.keccak256(req.data)]);
      const sig = await accounts[0].signMessage(hashToSign);
      await expect(erc20FeeProxy.executePersonalSign(req,sig)).to.be.revertedWith();
    });

    });

  describe("EIP712", function(){

    it("executes call successfully", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
      req.from = await accounts[2].getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = 250000;
      req.price = (ethers.utils.parseUnits('20000','gwei')).toString();
      req.msgValue = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[4].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
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
      await erc20FeeProxy.executeEIP712(req,domainSeparator,sig);
      expect(await testRecipient.callsMade(req.from)).to.equal(1);
      req0=req;
  });

  it("Updates nonces", async function(){
      expect(await erc20FeeProxy.getNonce(await accounts[2].getAddress())).to.equal(1);
  });

  it("Only pays relayers for the amount of gas used", async function(){
    const expectedMax = (ethers.BigNumber.from(req0.gas*1.5)).mul(ethers.BigNumber.from(req0.price));//gas*price*1.5
    expect((await testnetDai.balanceOf(await accounts[4].getAddress())).lt(expectedMax)).to.equal(true);
  });

  it("Transfers the correct value when msgValue is non zero", async function(){
      //creates random wallet (so we can guarantee balance is zero)
      const rwallet = ethers.Wallet.createRandom();
      const req = {to:await rwallet.getAddress(),data:'0x'} 
      req.from = await accounts[2].getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = 21000;
      req.price = 0;
      req.msgValue = (ethers.utils.parseEther("1")).toString();
      req.data = req.data;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
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
      await erc20FeeProxy.executeEIP712(req,domainSeparator,sig,{value:req.msgValue});
      expect((await ethers.provider.getBalance(req.to)).toString()).to.equal(req.msgValue);
  });

  it("Transfers any funds received to the 'from address'", async function(){
      const rwallet = ethers.Wallet.createRandom();
      const req = await faucet.populateTransaction.payUp(forwarder.address,(ethers.utils.parseEther("1")).toString());
      req.from = await accounts[3].getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = 21000;
      req.price = 0;
      req.msgValue = 0;
      req.data = req.data;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
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
      const preBalance = await ethers.provider.getBalance(req.from);
      await erc20FeeProxy.executeEIP712(req,domainSeparator,sig,{value:req.msgValue});
      expect(((await ethers.provider.getBalance(req.from)).sub(preBalance)).toString()).to.equal(ethers.utils.parseEther("1"));
  });

  it("Fails when nonce invalid", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
      req.from = await accounts[2].getAddress();
      req.nonce = 0;
      req.gas = (req.gasLimit).toNumber();
      req.price = 0;
      req.msgValue = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
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
      await expect(erc20FeeProxy.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
  });

  it("Fails when signer invalid", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
      req.from = await accounts[2].getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = (req.gasLimit).toNumber();
      req.price = 0;
      req.msgValue = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[0].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
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
      const sig = await ethers.provider.send("eth_signTypedData",[await accounts[1].getAddress(),dataToSign]);
      await expect(erc20FeeProxy.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
  });

  });

  describe("Fee Transfer Handler", function(){
    it("fee handler charges based on gas used, not req.gas", async function(){
      const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
      req.from = await accounts[1].getAddress();
      req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
      req.gas = 250000;
      req.price = (ethers.utils.parseUnits('20000','gwei')).toString();
      req.msgValue = 0;
      delete req.gasPrice;
      delete req.gasLimit;
      delete req.chainId;
      req.token = testnetDai.address;
      req.feeReceiver = await accounts[5].getAddress();
      req.feeMultiplierManager = mockFeeMultiplier.address;
      const hashToSign = abi.soliditySHA3(['address','address','address','address','address',
                                           'uint256','uint256','uint256','uint256','bytes32'],
                                          [req.from,req.to,req.token,req.feeReceiver,req.feeMultiplierManager,
                                           req.msgValue,req.gas,req.price,req.nonce,ethers.utils.keccak256(req.data)]);
      const sig = await accounts[1].signMessage(hashToSign);
      await erc20FeeProxy.executePersonalSign(req,sig);
      const expectedMax = (ethers.BigNumber.from(req.gas*1.5)).mul(ethers.BigNumber.from(req.price));//gas*price*1.5
      expect((await testnetDai.balanceOf(await accounts[5].getAddress())).lt(expectedMax)).to.equal(true);
  });

  it("fee handler charges based on gas used, not req.gas", async function(){
    const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
    req.from = await accounts[1].getAddress();
    req.nonce = (await erc20FeeProxy.getNonce(req.from)).toNumber();
    req.gas = 250000;
    req.price = (ethers.utils.parseUnits('20000','gwei')).toString();
    req.msgValue = 0;
    delete req.gasPrice;
    delete req.gasLimit;
    delete req.chainId;
    req.token = testnetDai.address;
    req.feeReceiver = await accounts[5].getAddress();
    req.feeMultiplierManager = mockFeeMultiplier.address;
    const hashToSign = abi.soliditySHA3(['address','address','address','address','address',
                                         'uint256','uint256','uint256','uint256','bytes32'],
                                        [req.from,req.to,req.token,req.feeReceiver,req.feeMultiplierManager,
                                         req.msgValue,req.gas,req.price,req.nonce,ethers.utils.keccak256(req.data)]);
    const sig = await accounts[1].signMessage(hashToSign);
    await erc20FeeProxy.executePersonalSign(req,sig);
    const expectedMax = (ethers.BigNumber.from(req.gas*1.5)).mul(ethers.BigNumber.from(req.price));//gas*price*1.5
    expect((await testnetDai.balanceOf(await accounts[5].getAddress())).lt(expectedMax)).to.equal(true);
  });
    //fee handler multiplies fee correctly
    //fee handler considers price correctly
    //fee handler charges based on gas used, not req.gas
    //transfer handler gas amount added correctly to total gas charged
    //transfers from correct token
    //transfers to correct address
    //transfers from correct address
  });

})