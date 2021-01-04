const { expect } = require("chai");
var abi = require('ethereumjs-abi');

describe("Gas Consumption Kovan", function(){

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
    let uniswapRouter;
    let realDai;
    let GUSD;
    let USDC;
    let USDT;

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
        {name:'data',type:'bytes'}
    ];

    before(async function(){
        accounts = await ethers.getSigners();
  
        const TestnetDai = await ethers.getContractFactory("TestnetDAI");
        testnetDai = await TestnetDai.deploy();
        await testnetDai.deployed();
  
        //setup contracts
        //realDai = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20","0x6b175474e89094c44da98b954eedeac495271d0f");
        //GUSD = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20","0x056fd409e1d7a124bd7017459dfea2f387b6d5cd");
        //USDC = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20","0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
        //USDT = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20","0xdac17f958d2ee523a2206206994597c13d831ec7");
  
        //uniswapRouter = await ethers.getContractAt("IUniswapV2Router02","0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
  
        //fill account 0
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,GUSD.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("10").toString()});
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
      
        //console.log("USDC Balance : "+(await USDC.balanceOf(await accounts[0].getAddress())).toString());
        //console.log("Dai Balance : "+(await realDai.balanceOf(await accounts[0].getAddress())).toString());
        
  
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
  
        await (await forwarder.registerDomainSeparator("TestRecipient","1")).wait(confirmations=2);
        domainSeparator = ethers.utils.keccak256((ethers.utils.defaultAbiCoder).
                          encode(['bytes32','bytes32','bytes32','uint256','address'],
                                 [ethers.utils.id("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                                 ethers.utils.id(domainData.name),ethers.utils.id(domainData.version),
                                 domainData.chainId,domainData.verifyingContract]));
  
        //deploy fee multiplier with a factor of 1.5x
        //deploy fee manager with a factor of 1.5x
        const MockFeeManager = await ethers.getContractFactory("MockFeeManager");
        mockFeeManager = await MockFeeManager.deploy(15000);
        await mockFeeManager.deployed();
  
        const ERC20FeeProxy = await ethers.getContractFactory("ERC20FeeProxy");
        erc20FeeProxy = await ERC20FeeProxy.deploy(await accounts[0].getAddress(), mockFeeManager.address, forwarder.address);
        await erc20FeeProxy.deployed();
  
        //await erc20FeeProxy.setSafeTransferRequired(USDT.address,true);
  
        
        //await USDC.approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));
        //await GUSD.approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));
        //await USDT.approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"));
  
      });

      /*it("Biconomy Forwarder Only Personal", async function(){
          //new nonce x10 personal
          //new batch x10 personal
          for(i=0;i<10;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
            req.from = await accounts[1].getAddress();
            req.batchNonce = i;
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
            const tx = await forwarder.executePersonalSign(req,sig);
            const receipt = await tx.wait();
            console.log("Biconomy Forwarder nonce="+req.batchNonce+" gas used :"+receipt.gasUsed.toString()+" Tx Hash :"+receipt.transactionHash)
          }
          for(i=0;i<10;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[1].getAddress());
            req.from = await accounts[1].getAddress();
            req.batchNonce = 0;
            req.batchId = i+1;
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
            const tx = await forwarder.executePersonalSign(req,sig);
            const receipt = await tx.wait();
            console.log("Biconomy Forwarder Batch="+req.batchId+" gas used :"+receipt.gasUsed.toString()+" Tx Hash :"+receipt.transactionHash)
          }
      });

      it("Biconomy Forwarder Only EIP712", async function(){
        for(i=0;i<3;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
            req.from = await accounts[2].getAddress();
            req.batchNonce = i;
            req.batchId = 0;
            req.txGas = (req.gasLimit).toNumber();
            req.tokenGasPrice = 0;
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = testnetDai.address;
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
            const tx = await forwarder.executeEIP712(req,domainSeparator,sig);
            const receipt = await tx.wait(confirmations = 5);
            console.log("Biconomy Forwarder nonce="+req.batchNonce+" gas used :"+receipt.gasUsed.toString()+" Tx Hash :"+receipt.transactionHash)
          }
          for(i=0;i<3;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[2].getAddress());
            req.from = await accounts[2].getAddress();
            req.batchNonce = 0;
            req.batchId = i+1;
            req.txGas = (req.gasLimit).toNumber();
            req.tokenGasPrice = 0;
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = testnetDai.address;
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
            const tx = await forwarder.executeEIP712(req,domainSeparator,sig);
            const receipt = await tx.wait(confirmations = 5);
            console.log("Biconomy Forwarder Batch="+req.batchId+" gas used :"+receipt.gasUsed.toString()+" Tx Hash :"+receipt.transactionHash)
          }
      });*/

      it("Baseline Token personal ", async function(){
        await (await testnetDai.mint(await accounts[3].getAddress(), ethers.utils.parseEther("1000"))).wait(confirmations=2);
        await (await testnetDai.connect(accounts[3]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"))).wait(confirmations=2);
        for(i=0;i<3;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[3].getAddress());
            req.from = await accounts[3].getAddress();
            req.batchNonce = i;
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
            const tx = await erc20FeeProxy.executePersonalSign(req,sig);
            const receipt = await tx.wait(confirmations = 5);
            console.log("FeeProxy with Baseline token nonce="+req.batchNonce+" gas used :"+receipt.gasUsed.toString())
          }
        for(i=0;i<3;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[3].getAddress());
            req.from = await accounts[3].getAddress();
            req.batchNonce = 0;
            req.batchId = i+1;
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
            const tx = await erc20FeeProxy.executePersonalSign(req,sig);
            const receipt = await tx.wait(confirmations = 5);
            console.log("FeeProxy with Baseline token Batch="+req.batchId+" gas used :"+receipt.gasUsed.toString()+" Tx Hash :"+receipt.transactionHash)
          }
      });

      it("Baseline Token EIP712", async function(){
        await (await testnetDai.mint(await accounts[4].getAddress(), ethers.utils.parseEther("1000"))).wait(confirmations=2);
        await (await testnetDai.connect(accounts[4]).approve(erc20FeeProxy.address,ethers.utils.parseEther("1000"))).wait(confirmations=2);
        for(i=0;i<3;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[4].getAddress());
            req.from = await accounts[4].getAddress();
            req.batchNonce = i;
            req.batchId = 0;
            req.txGas = (req.gasLimit).toNumber();
            req.tokenGasPrice = (ethers.utils.parseUnits('20000','gwei')).toString();
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = testnetDai.address;
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
            const tx = await erc20FeeProxy.executeEIP712(req,domainSeparator,sig);
            const receipt = await tx.wait(confirmations = 5);
            console.log("Biconomy Forwarder nonce="+req.batchNonce+" gas used :"+receipt.gasUsed.toString()+" Tx Hash :"+receipt.transactionHash)
          }
          for(i=0;i<3;i++){
            const req = await testRecipient.populateTransaction.doCall(await accounts[4].getAddress());
            req.from = await accounts[4].getAddress();
            req.batchNonce = 0;
            req.batchId = i+1;
            req.txGas = (req.gasLimit).toNumber();
            req.tokenGasPrice = (ethers.utils.parseUnits('20000','gwei')).toString();
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = testnetDai.address;
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
            const tx = await erc20FeeProxy.executeEIP712(req,domainSeparator,sig);
            const receipt = await tx.wait(confirmations = 5);
            console.log("Biconomy Forwarder Batch="+req.batchId+" gas used :"+receipt.gasUsed.toString()+" Tx Hash :"+receipt.transactionHash)
          }
    });

})