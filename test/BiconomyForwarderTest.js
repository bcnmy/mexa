const { expect } = require("chai");
const abi = require('ethereumjs-abi');

describe("Biconomy Forwarder", function(){

    let accounts;
    let forwarder;
    let testRecipient;
    let domainData;
    let domainSeparator;
    let testnetDai;
    let mockFeeMultiplier;
    let faucet;

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


    });

    describe("personal sign", function(){
        it("executes call successfully", async function(){
            const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
            req.from = await accounts[1].getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
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
            await forwarder.executePersonalSign(req,sig);
            expect(await testRecipient.callsMade(req.from)).to.equal(1);
        });
    
        it("Updates nonces", async function(){
            expect(await forwarder.getNonce(await accounts[1].getAddress())).to.equal(1);
        });
    
        it("Transfers the correct value when msgValue is non zero", async function(){
            //creates random wallet (so we can guarantee balance is zero)
            const rwallet = ethers.Wallet.createRandom();
            const req = {to:await rwallet.getAddress(),data:'0x'} 
            req.from = await accounts[1].getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
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
            await forwarder.executePersonalSign(req,sig,{value:req.msgValue});
            expect((await ethers.provider.getBalance(req.to)).toString()).to.equal(req.msgValue);
        });

        it("Transfers any funds received to the 'from address'", async function(){
            const rwallet = ethers.Wallet.createRandom();
            const req = await faucet.populateTransaction.payUp(forwarder.address,(ethers.utils.parseEther("1")).toString());
            req.from = await rwallet.getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
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
            await forwarder.executePersonalSign(req,sig);
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
            await expect(forwarder.executePersonalSign(req,sig)).to.be.revertedWith();
        });

        it("Fails when signer invalid", async function(){
            const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
            req.from = await accounts[1].getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
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
            await expect(forwarder.executePersonalSign(req,sig)).to.be.revertedWith();
        });

    });

    describe("EIP712", function(){
        it("executes call successfully", async function(){
            const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
            req.from = await accounts[2].getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
            req.gas = (req.gasLimit).toNumber();
            req.price = 0;
            req.msgValue = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = testnetDai.address;
            req.feeReceiver = await accounts[0].getAddress();
            req.feeMultiplierManager = mockFeeMultiplier.address;
            const erc20fr = Object.assign({}, req);;
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
            await forwarder.executeEIP712(req,domainSeparator,sig);
            expect(await testRecipient.callsMade(req.from)).to.equal(1);
        });
    
        it("Updates nonces", async function(){
            expect(await forwarder.getNonce(await accounts[2].getAddress())).to.equal(1);
        });
    
        it("Transfers the correct value when msgValue is non zero", async function(){
            //creates random wallet (so we can guarantee balance is zero)
            const rwallet = ethers.Wallet.createRandom();
            const req = {to:await rwallet.getAddress(),data:'0x'} 
            req.from = await accounts[2].getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
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
            const erc20fr = Object.assign({}, req);;
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
            await forwarder.executeEIP712(req,domainSeparator,sig,{value:req.msgValue});
            expect((await ethers.provider.getBalance(req.to)).toString()).to.equal(req.msgValue);
        });

        it("Transfers any funds received to the 'from address'", async function(){
            const rwallet = ethers.Wallet.createRandom();
            const req = await faucet.populateTransaction.payUp(forwarder.address,(ethers.utils.parseEther("1")).toString());
            req.from = await accounts[3].getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
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
            const erc20fr = Object.assign({}, req);;
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
            await forwarder.executeEIP712(req,domainSeparator,sig,{value:req.msgValue});
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
            const erc20fr = Object.assign({}, req);;
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
            await expect(forwarder.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
        });

        it("Fails when signer invalid", async function(){
            const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
            req.from = await accounts[2].getAddress();
            req.nonce = (await forwarder.getNonce(req.from)).toNumber();
            req.gas = (req.gasLimit).toNumber();
            req.price = 0;
            req.msgValue = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = testnetDai.address;
            req.feeReceiver = await accounts[0].getAddress();
            req.feeMultiplierManager = mockFeeMultiplier.address;
            const erc20fr = Object.assign({}, req);;
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
            await expect(forwarder.executeEIP712(req,domainSeparator,sig)).to.be.revertedWith();
        });

    });
      


});