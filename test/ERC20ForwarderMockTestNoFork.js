const {
    expect
  } = require("chai");
  var abi = require('ethereumjs-abi');
  let sigUtil = require("eth-sig-util");
  const {
    ethers
  } = require("hardhat");
  
  const salt = ethers.BigNumber.from(31337);
  
  
  //const privateKey = <ACCOUNT_1_PRIVATE_KEY>;
  
  const zero_address = "0x0000000000000000000000000000000000000000";;
  
  describe("ERC20Forwarder", function () {
  
    let accounts;
    let forwarder;
    let testRecipient;
    let domainData;
    let erc20Forwarder;
    let biconomyForwarder;
    let erc20ForwarderProxy;
    let forwarderProxy;
    let oracleAggregator;
    let testForward;
    let realERC20Forwarder;
    let realERC20ForwarderProxy;
    let realFeeManager;
    let realOracleAggregator;
    let testnetDai;
    let mockFeeManager;
    let centralisedFeeManager;
    let domainSeparator;
    let faucet;
    var req0;
    let uniswapRouter;
    let realDai;
    let USDC;
    let USDT;
    //let WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  
    let domainType = [{
        name: "name",
        type: "string"
      },
      {
        name: "version",
        type: "string"
      },
      {
        name: "verifyingContract",
        type: "address"
      },
      {
        name: "salt",
        type: "bytes32"
      }
    ];
  
    let erc20ForwardRequest = [{
        name: 'from',
        type: 'address'
      },
      {
        name: 'to',
        type: 'address'
      },
      {
        name: 'token',
        type: 'address'
      },
      {
        name: 'txGas',
        type: 'uint256'
      },
      {
        name: 'tokenGasPrice',
        type: 'uint256'
      },
      {
        name: 'batchId',
        type: 'uint256'
      },
      {
        name: 'batchNonce',
        type: 'uint256'
      },
      {
        name: 'deadline',
        type: 'uint256'
      },
      {
        name: 'data',
        type: 'bytes'
      }
    ];
  
    before(async function () {
      accounts = await ethers.getSigners();

      //const daiEthPriceFeedAddress =
      //  "0x773616E4d11A78F511299002da57A0a94577F1f4";
      //const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
      const daiDecimals = 18;

      const DaiTransferHandlerGas = 46314;
      //const USDCTransferHandlerGas = 56321;
      //const USDTransferHandlerGas = 56734;

      /*const usdcEthPriceFeedAddress =
        "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4";
      const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
      const usdcDecimals = 18;

      const usdtEthPriceFeedAddress =
        "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46";
      const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
      const usdtDecimals = 18;*/

      const owner = "0x9AAFe3E7E4Fe0E15281831f7D2f33eFfE18Fc7d5";
      const ERC20ForwarderProxyAdmin =
        "0xccb9bA42d45ee6a7E3176B2f865Fb53266B6384D";
      const feeReceiver = "0xabcd3f544CF8c7AcF59AB0dA6e89e170d610bA91";
  
      const TestnetDai = await ethers.getContractFactory("TestnetDAI");
      testnetDai = await TestnetDai.deploy();
      await testnetDai.deployed();

      const daiAddress = testnetDai.address;

      //mint some DAI
  
      //setup contracts
      /*realDai = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0x6b175474e89094c44da98b954eedeac495271d0f");
      GUSD = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd");
      USDC = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
      USDT = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0xdac17f958d2ee523a2206206994597c13d831ec7");
      biconomyForwarder = await ethers.getContractAt("contracts/6/forwarder/BiconomyForwarder.sol:BiconomyForwarder", "0x84a0856b038eaAd1cC7E297cF34A7e72685A8693");
      console.log("biconomyForwarder");
      console.log(biconomyForwarder.address);*/
  
     // uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
  
      //fill account 0
      //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
      //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDT.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("10").toString()});
      //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
  
      /*console.log("USDC Balance : "+(await USDC.balanceOf(await accounts[0].getAddress())).toString());
      console.log("Dai Balance : "+(await realDai.balanceOf(await accounts[0].getAddress())).toString());
      console.log("USDT Balance : "+(await USDT.balanceOf(await accounts[0].getAddress())).toString());*/

      //fill account 1
      /*await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
      await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDT.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("10").toString()});
      await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
  
      console.log("USDC Balance : "+(await USDC.balanceOf(await accounts[1].getAddress())).toString());
      console.log("Dai Balance : "+(await realDai.balanceOf(await accounts[1].getAddress())).toString());
      console.log("USDT Balance : "+(await USDT.balanceOf(await accounts[1].getAddress())).toString());*/
  
  
      const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
      forwarder = await Forwarder.deploy(await accounts[0].getAddress());
      await forwarder.deployed();
      console.log(forwarder.address);
  
      const TestRecipient = await ethers.getContractFactory("TestRecipient");
      testRecipient = await TestRecipient.deploy(forwarder.address);
      await testRecipient.deployed();

      const ForwardTest = await ethers.getContractFactory("ForwardTest");
      testForward = await ForwardTest.deploy(forwarder.address); 
      await testForward.deployed();
  
      domainData = {
        name: "Biconomy Forwarder",
        version: "1",
        verifyingContract: forwarder.address,
        salt: ethers.utils.hexZeroPad(salt.toHexString(), 32)
      };

      // on real biconomy forwarder this domain separator is already registered
  
      await forwarder.registerDomainSeparator("Biconomy Forwarder", "1");

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
  
      const CentralisedFeeManager = await hre.ethers.getContractFactory("CentralisedFeeManager");
      centralisedFeeManager = await CentralisedFeeManager.deploy(owner, 10000);
      await centralisedFeeManager.deployed();

      /*await centralisedFeeManager.setTokenAllowed(realDai.address, true);
      await centralisedFeeManager.setTokenAllowed(USDC.address, true);
      await centralisedFeeManager.setTokenAllowed(USDT.address, true);*/
      await centralisedFeeManager.setTokenAllowed(testnetDai.address, true);

      /*realFeeManager = await ethers.getContractAt("contracts/6/feeManager/CentralisedFeeManager.sol:CentralisedFeeManager", "0x00Cb95F4ADF64E4B2b9cCe9EcCcf17C1a7478227");
      realOracleAggregator = await ethers.getContractAt("contracts/6/forwarder/OracleAggregator.sol:OracleAggregator", "0x10101e93530D2992Ca49674eBf19d85f40348C41");
      realERC20Forwarder = await ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder", "0xfaadbe5f0a19f0ebf92aeb73534cbc96b96e2bda"); //could give proxy's address here
      //logic address // 0xFc46d3F2D7C005940e86A08725CFe4Df2b88448a
      realERC20ForwarderProxy = await ethers.getContractAt("contracts/6/forwarder/ERC20ForwarderProxy.sol:ERC20ForwarderProxy", "0xfaadbe5f0a19f0ebf92aeb73534cbc96b96e2bda");

      //await realFeeManager.setTokenAllowed(testnetDai.address, true); //only owner can do this
      */
  
      //deploy and fill up faucet
      const Faucet = await ethers.getContractFactory("mockFaucet");
      faucet = await Faucet.deploy();
      await faucet.deployed();
      await accounts[0].sendTransaction({
        value: ethers.utils.parseEther("100"),
        to: faucet.address
      });
  
      const ERC20Forwarder = await ethers.getContractFactory("ERC20Forwarder");
      erc20Forwarder = await ERC20Forwarder.deploy(owner);
      await erc20Forwarder.deployed();

      await erc20Forwarder.initialize(feeReceiver, centralisedFeeManager.address, forwarder.address); 
      //await erc20Forwarder.setSafeTransferRequired(USDT.address, true);

      /*const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
      erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address, ERC20ForwarderProxyAdmin, owner); // could use real erc forwarder address
      await erc20ForwarderProxy.deployed();

      // could use realERC20Forwarder with deployed proxy address
      forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder", erc20ForwarderProxy.address);

      await forwarderProxy.initialize(feeReceiver, centralisedFeeManager.address, forwarder.address);
      //await forwarderProxy.setSafeTransferRequired(USDT.address, true);*/

      let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
      oracleAggregator = await OracleAggregator.deploy(owner);
      await oracleAggregator.deployed();

      /*let priceFeedDai = await hre.ethers.getContractAt("AggregatorInterface", daiEthPriceFeedAddress);
      let priceFeedTxDai = await priceFeedDai.populateTransaction.latestAnswer();
      await oracleAggregator.setTokenOracle(daiAddress, daiEthPriceFeedAddress, daiDecimals, priceFeedTxDai.data, true);
    
      console.log('✅ DAI support added');
      console.log(`✅ DAI address : ${daiAddress}`);
   
      let priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface", usdcEthPriceFeedAddress);
      let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
      await oracleAggregator.setTokenOracle(usdcAddress, usdcEthPriceFeedAddress, usdcDecimals, priceFeedTxUsdc.data, true);
  
      console.log('✅ USDC support added');
      console.log(`✅ USDC address : ${usdcAddress}`);
   
      let priceFeedUsdt = await hre.ethers.getContractAt("AggregatorInterface", usdtEthPriceFeedAddress);
      let priceFeedTxUsdt = await priceFeedUsdt.populateTransaction.latestAnswer();
      await oracleAggregator.setTokenOracle(usdtAddress, usdtEthPriceFeedAddress, usdtDecimals, priceFeedTxUsdt.data, true);
  
  
      console.log('✅ USDT support added');
      console.log(`✅ USDT address : ${usdtAddress}`);*/
  
      //await forwarderProxy.setOracleAggregator(oracleAggregator.address);
      await erc20Forwarder.setOracleAggregator(oracleAggregator.address);

     // await forwarderProxy.setTransferHandlerGas(testnetDai.address, DaiTransferHandlerGas);
      await erc20Forwarder.setTransferHandlerGas(testnetDai.address, DaiTransferHandlerGas);

      /*await forwarderProxy.setTransferHandlerGas(daiAddress, DaiTransferHandlerGas);
      await forwarderProxy.setTransferHandlerGas(usdcAddress, USDCTransferHandlerGas);
      await forwarderProxy.setTransferHandlerGas(usdtAddress, USDTransferHandlerGas);*/
   
      //minted testnet DAI
      await testnetDai.mint(await accounts[0].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.mint(await accounts[1].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.mint(await accounts[2].getAddress(), ethers.utils.parseEther("1000"));
      await testnetDai.mint(await accounts[3].getAddress(), ethers.utils.parseEther("1000"));

      await testnetDai.connect(accounts[0]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[1]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[2]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
      await testnetDai.connect(accounts[3]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));

      /*await realDai.connect(accounts[0]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      await realDai.connect(accounts[1]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      await realDai.connect(accounts[2]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      await realDai.connect(accounts[3]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));

      await USDC.connect(accounts[0]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      await USDC.connect(accounts[1]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      await USDC.connect(accounts[2]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      await USDC.connect(accounts[3]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));

      /*let checkAllowance1 = await USDC.allowance(await accounts[1].getAddress(),realERC20Forwarder.address);
      
      console.log("check allowance 1 and 2");
      console.log(checkAllowance1.toString());
      
      console.log("check token oracle decimals");
      let decimalsUSDC = await realOracleAggregator.getTokenOracleDecimals(USDC.address);
      console.log(decimalsUSDC.toString());

      console.log("check token oracle decimals");
      let decimalsUSDT = await realOracleAggregator.getTokenOracleDecimals(USDT.address);
      console.log(decimalsUSDT.toString());*/

      //await USDT.connect(accounts[0]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      //await USDT.connect(accounts[1]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      //await USDT.connect(accounts[2]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));
      //await USDT.connect(accounts[3]).approve(realERC20Forwarder.address, ethers.utils.parseEther("1000"));

      /*let checkAllowance2 = await USDT.allowance(await accounts[0].getAddress(),realERC20Forwarder.address);
      console.log(checkAllowance2.toString());*/
    });

    describe("Biconomy Forwarder Personal Sign", function () {
  
        it("executes call successfully", async function () {
          //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
          const req = await testForward.populateTransaction.nada();
          console.log(req);
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.from = await accounts[0].getAddress();
          req.batchNonce = 0;
          req.batchId = 0;
          req.txGas = txGas.toNumber();
          console.log("tx Gas...");
          console.log(txGas.toNumber());
          req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = zero_address;
          const hashToSign = abi.soliditySHA3(
            [
              "address",
              "address",
              "address",
              "uint256",
              "uint256",
              "uint256",
              "uint256",
              "uint256",
              "bytes32",
            ],
            [
              req.from,
              req.to,
              req.token,
              req.txGas,
              req.tokenGasPrice,
              req.batchId,
              req.batchNonce,
              req.deadline,
              ethers.utils.keccak256(req.data),
            ]
          );
          const sig = await accounts[0].signMessage(hashToSign);
          const tx = await forwarder.executePersonalSign(req, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });

        it("executes call successfully", async function () {
            const req = await testForward.populateTransaction.nada();
            const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
            req.from = await accounts[0].getAddress();
            req.batchNonce = 1;
            req.batchId = 0;
            req.txGas = txGas.toNumber();
            console.log("tx Gas...");
            console.log(txGas.toNumber());
            req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = zero_address;
            const hashToSign = abi.soliditySHA3(
              [
                "address",
                "address",
                "address",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "bytes32",
              ],
              [
                req.from,
                req.to,
                req.token,
                req.txGas,
                req.tokenGasPrice,
                req.batchId,
                req.batchNonce,
                req.deadline,
                ethers.utils.keccak256(req.data),
              ]
            );
            const sig = await accounts[0].signMessage(hashToSign);
            const tx = await forwarder.executePersonalSign(req, sig);
            const receipt = await tx.wait(1);
            console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            req0 = req;
          });

          it("executes call successfully", async function () {
            //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
            const req = await testForward.populateTransaction.nada();
            const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
            req.from = await accounts[0].getAddress();
            req.batchNonce = 2;
            req.batchId = 0;
            req.txGas = txGas.toNumber();
            console.log("tx Gas...");
            console.log(txGas.toNumber());
            req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = zero_address;
            const hashToSign = abi.soliditySHA3(
              [
                "address",
                "address",
                "address",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "bytes32",
              ],
              [
                req.from,
                req.to,
                req.token,
                req.txGas,
                req.tokenGasPrice,
                req.batchId,
                req.batchNonce,
                req.deadline,
                ethers.utils.keccak256(req.data),
              ]
            );
            const sig = await accounts[0].signMessage(hashToSign);
            const tx = await forwarder.executePersonalSign(req, sig);
            const receipt = await tx.wait(1);
            console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            req0 = req;
          });
    
        it("Updates nonces", async function () {
          expect(await forwarder.getNonce(await accounts[0].getAddress(), 0)).to.equal(3);
        });
      });

      describe("Biconomy Forwarder EIP712", function () {
  
        it("executes call successfully", async function () {
          const req = await testForward.populateTransaction.nada();
          console.log(req);
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.from = await accounts[1].getAddress();
          req.batchNonce = 0;
          req.batchId = 0;
          req.txGas = txGas.toNumber();
          console.log("tx Gas...");
          console.log(txGas.toNumber());
          req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = zero_address;
          const dataToSign = {
            types: {
              EIP712Domain: domainType,
              ERC20ForwardRequest: erc20ForwardRequest
            },
            domain: domainData,
            primaryType: "ERC20ForwardRequest",
            message: req
          };
          const sig = sigUtil.signTypedMessage(
            new Buffer.from(privateKey, "hex"),
            { data: dataToSign },
            "V3"
          );
          const tx = await forwarder.executeEIP712(req, domainSeparator, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });

        it("executes call successfully", async function () {
            const req = await testForward.populateTransaction.nada();
            const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
            req.from = await accounts[1].getAddress();
            req.batchNonce = 1;
            req.batchId = 0;
            req.txGas = txGas.toNumber();
            console.log("tx Gas...");
            console.log(txGas.toNumber());
            req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = zero_address;
            const dataToSign = {
                types: {
                  EIP712Domain: domainType,
                  ERC20ForwardRequest: erc20ForwardRequest
                },
                domain: domainData,
                primaryType: "ERC20ForwardRequest",
                message: req
              };
            const sig = sigUtil.signTypedMessage(
                new Buffer.from(privateKey, "hex"),
                { data: dataToSign },
                "V3"
              );
            const tx = await forwarder.executeEIP712(req, domainSeparator, sig);
            const receipt = await tx.wait(1);
            console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            req0 = req;
          });

          it("executes call successfully", async function () {
            const req = await testForward.populateTransaction.nada();
            const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
            req.from = await accounts[1].getAddress();
            req.batchNonce = 2;
            req.batchId = 0;
            req.txGas = txGas.toNumber();
            console.log("tx Gas...");
            console.log(txGas.toNumber());
            req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
            req.deadline = 0;
            delete req.gasPrice;
            delete req.gasLimit;
            delete req.chainId;
            req.token = zero_address;
            const dataToSign = {
                types: {
                  EIP712Domain: domainType,
                  ERC20ForwardRequest: erc20ForwardRequest
                },
                domain: domainData,
                primaryType: "ERC20ForwardRequest",
                message: req
              };
            const sig = sigUtil.signTypedMessage(
                new Buffer.from(privateKey, "hex"),
                { data: dataToSign },
                "V3"
              );
            const tx = await forwarder.executeEIP712(req, domainSeparator, sig);
            const receipt = await tx.wait(1);
            console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            req0 = req;
          });
    
        it("Updates nonces", async function () {
          expect(await forwarder.getNonce(await accounts[1].getAddress(), 0)).to.equal(3);
        });
      });
    
  
    describe("ERC20 Forwarder Personal Sign", function () {
  
      it("executes call successfully", async function () {
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[2].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        const req = await testForward.populateTransaction.nada();
        req.from = await accounts[2].getAddress();
        const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
        req.batchNonce = 0;
        req.batchId = 0;
        req.txGas = txGas.toNumber();
        console.log("tx Gas...");
        console.log(txGas.toNumber());
        req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
        req.deadline = 0;
        delete req.gasPrice;
        delete req.gasLimit;
        delete req.chainId;
        req.token = testnetDai.address;
        const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
          [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
            ethers.utils.keccak256(req.data)
          ]);
        const sig = await accounts[2].signMessage(hashToSign);
        const tx = await erc20Forwarder.executePersonalSign(req, sig);
        const receipt = await tx.wait(1);
        console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
        req0 = req;
      });

      it("executes call successfully", async function () {
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[2].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        const req = await testForward.populateTransaction.nada();
        req.from = await accounts[2].getAddress();
        const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
        req.batchNonce = 1;
        req.batchId = 0;
        req.txGas = txGas.toNumber();
        console.log("tx Gas...");
        console.log(txGas.toNumber());
        req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
        req.deadline = 0;
        delete req.gasPrice;
        delete req.gasLimit;
        delete req.chainId;
        req.token = testnetDai.address;
        const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
          [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
            ethers.utils.keccak256(req.data)
          ]);
        const sig = await accounts[2].signMessage(hashToSign);
        const tx = await erc20Forwarder.executePersonalSign(req, sig);
        const receipt = await tx.wait(1);
        console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
        req0 = req;
      });

      it("executes call successfully", async function () {
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[2].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        const req = await testForward.populateTransaction.nada();
        req.from = await accounts[2].getAddress();
        const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
        req.batchNonce = 2;
        req.batchId = 0;
        req.txGas = txGas.toNumber();
        console.log("tx Gas...");
        console.log(txGas.toNumber());
        req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
        req.deadline = 0;
        delete req.gasPrice;
        delete req.gasLimit;
        delete req.chainId;
        req.token = testnetDai.address;
        const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
          [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
            ethers.utils.keccak256(req.data)
          ]);
        const sig = await accounts[2].signMessage(hashToSign);
        const tx = await erc20Forwarder.executePersonalSign(req, sig);
        const receipt = await tx.wait(1);
        console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
        req0 = req;
      });
  
      it("Updates nonces", async function () {
        expect(await erc20Forwarder.getNonce(await accounts[2].getAddress(), 0)).to.equal(3);
      });
    });
  
    describe("ERC20 Forwarder EIP712 sign + DAI token", function () {
  
      it("executes call successfully", async function () {
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        const req = await testForward.populateTransaction.nada();
        req.from = await accounts[1].getAddress();
        const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
        req.batchNonce = 0;
        req.batchId = 5;
        req.txGas = txGas.toNumber();
        req.tokenGasPrice = (ethers.utils.parseUnits('20', 'gwei')).toString();
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
        //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
        const sig = sigUtil.signTypedMessage(
          new Buffer.from(privateKey, "hex"),
          { data: dataToSign },
          "V3"
        );
        const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
        const receipt = await tx.wait(1);
        console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
        req0 = req;
      });

      it("executes call successfully", async function () {
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        const req = await testForward.populateTransaction.nada();
        req.from = await accounts[1].getAddress();
        const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
        req.batchNonce = 1;
        req.batchId = 5;
        req.txGas = txGas.toNumber();
        req.tokenGasPrice = (ethers.utils.parseUnits('20', 'gwei')).toString();
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
        //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
        const sig = sigUtil.signTypedMessage(
          new Buffer.from(privateKey, "hex"),
          { data: dataToSign },
          "V3"
        );
        const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
        const receipt = await tx.wait(1);
        console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
        req0 = req;
      });

      it("executes call successfully", async function () {
        //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
        const req = await testForward.populateTransaction.nada();
        req.from = await accounts[1].getAddress();
        const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
        req.batchNonce = 2;
        req.batchId = 5;
        req.txGas = txGas.toNumber();
        req.tokenGasPrice = (ethers.utils.parseUnits('20', 'gwei')).toString();
        console.log("DAI token gas price check.." + req.tokenGasPrice);
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
        //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
        const sig = sigUtil.signTypedMessage(
          new Buffer.from(privateKey, "hex"),
          { data: dataToSign },
          "V3"
        );
        const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
        const receipt = await tx.wait(1);
        console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
        req0 = req;
      });
  
      it("Updates nonces", async function () {
        expect(await erc20Forwarder.getNonce(await accounts[1].getAddress(), 5)).to.equal(3);
      });

    });

    /*describe("ERC20 Forwarder EIP712 sign + USDC token", function () {
  
        it("executes call successfully", async function () {
          await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("100").toString()});
          const bal = await USDC.balanceOf(await accounts[1].getAddress());
          console.log(`balance of called ${bal.toString()}`);
          const req = await testForward.populateTransaction.nada();
          req.from = await accounts[1].getAddress();
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.batchNonce = 0;
          req.batchId = 7;
          req.txGas = txGas.toNumber();
          req.tokenGasPrice = "36";
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = USDC.address;
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
          //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
          const sig = sigUtil.signTypedMessage(
            new Buffer.from(privateKey, "hex"),
            { data: dataToSign },
            "V3"
          );
          const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });
  
        it("executes call successfully", async function () {
          await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("100").toString()});
          const req = await testForward.populateTransaction.nada();
          req.from = await accounts[1].getAddress();
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.batchNonce = 1;
          req.batchId = 7;
          req.txGas = txGas.toNumber();
          req.tokenGasPrice = "21";
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = USDC.address;
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
          //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
          const sig = sigUtil.signTypedMessage(
            new Buffer.from(privateKey, "hex"),
            { data: dataToSign },
            "V3"
          );
          const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });
  
        it("executes call successfully", async function () {
          await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("100").toString()});
          const req = await testForward.populateTransaction.nada();
          req.from = await accounts[1].getAddress();
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.batchNonce = 2;
          req.batchId = 7;
          req.txGas = txGas.toNumber();
          req.tokenGasPrice = "41";
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = USDC.address;
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
          //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
          const sig = sigUtil.signTypedMessage(
            new Buffer.from(privateKey, "hex"),
            { data: dataToSign },
            "V3"
          );
          const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });
    
        it("Updates nonces", async function () {
          expect(await realERC20Forwarder.getNonce(await accounts[1].getAddress(), 7)).to.equal(3);
        });
  
      });

      /*describe("ERC20 Forwarder EIP712 sign + USDT token", function () {
  
        it("executes call successfully", async function () {
          await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDT.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("100").toString()});
          const req = await testForward.populateTransaction.nada();
          req.from = await accounts[0].getAddress();
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.batchNonce = 0;
          req.batchId = 8;
          req.txGas = txGas.toNumber();
          req.tokenGasPrice = "36";
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = USDT.address;
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
          //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
          const sig = sigUtil.signTypedMessage(
            new Buffer.from(privateKey, "hex"),
            { data: dataToSign },
            "V3"
          );
          const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });
  
        it("executes call successfully", async function () {
          await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDT.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("100").toString()});
          const req = await testForward.populateTransaction.nada();
          req.from = await accounts[0].getAddress();
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.batchNonce = 1;
          req.batchId = 8;
          req.txGas = txGas.toNumber();
          req.tokenGasPrice = "21";
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = USDT.address;
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
          //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
          const sig = sigUtil.signTypedMessage(
            new Buffer.from(privateKey, "hex"),
            { data: dataToSign },
            "V3"
          );
          const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });
  
        it("executes call successfully", async function () {
          await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDT.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("100").toString()});
          const req = await testForward.populateTransaction.nada();
          req.from = await accounts[0].getAddress();
          const txGas = await ethers.provider.estimateGas({from:req.from,to:testForward.address,data:req.data});
          req.batchNonce = 2;
          req.batchId = 8;
          req.txGas = txGas.toNumber();
          req.tokenGasPrice = "41";
          req.deadline = 0;
          delete req.gasPrice;
          delete req.gasLimit;
          delete req.chainId;
          req.token = USDT.address;
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
          //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
          const sig = sigUtil.signTypedMessage(
            new Buffer.from(privateKey, "hex"),
            { data: dataToSign },
            "V3"
          );
          const tx = await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
          const receipt = await tx.wait(1);
          console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
          req0 = req;
        });
    
        it("Updates nonces", async function () {
          expect(await realERC20Forwarder.getNonce(await accounts[0].getAddress(), 8)).to.equal(3);
        });
  
      });*/
  
  })