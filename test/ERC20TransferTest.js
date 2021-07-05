// const {
//   expect
// } = require("chai");
// var abi = require('ethereumjs-abi');
// let sigUtil = require("eth-sig-util");
// const {
//   ethers
// } = require("hardhat");

// const salt = ethers.BigNumber.from(31337);

// //const privateKey = <ACCOUNT_1_PRIVATe_KEY>

// //TODO
// //Add test cases for Transfer Handler Custom
// describe("ERC20TransferCustom", function () {

//   let accounts;
//   let forwarder;
//   let testRecipient;
//   let domainData;
//   let erc20Forwarder;
//   let testnetDai;
//   let mockFeeManager;
//   let domainSeparator;
//   let faucet;
//   var req0;
//   let uniswapRouter;
//   let realDai;
//   let GUSD;
//   let USDC;
//   let USDT;
//   let WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

//   let domainType = [{
//       name: "name",
//       type: "string"
//     },
//     {
//       name: "version",
//       type: "string"
//     },
//     {
//       name: "verifyingContract",
//       type: "address"
//     },
//     {
//       name: "salt",
//       type: "bytes32"
//     }
//   ];

//   let erc20ForwardRequest = [{
//       name: 'from',
//       type: 'address'
//     },
//     {
//       name: 'to',
//       type: 'address'
//     },
//     {
//       name: 'token',
//       type: 'address'
//     },
//     {
//       name: 'txGas',
//       type: 'uint256'
//     },
//     {
//       name: 'tokenGasPrice',
//       type: 'uint256'
//     },
//     {
//       name: 'batchId',
//       type: 'uint256'
//     },
//     {
//       name: 'batchNonce',
//       type: 'uint256'
//     },
//     {
//       name: 'deadline',
//       type: 'uint256'
//     },
//     {
//       name: 'data',
//       type: 'bytes'
//     }
//   ];

//   before(async function () {
//     accounts = await ethers.getSigners();

//     const TestnetDai = await ethers.getContractFactory("TestnetDAI");
//     testnetDai = await TestnetDai.deploy();
//     await testnetDai.deployed();

//     //setup contracts
//     realDai = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0x6b175474e89094c44da98b954eedeac495271d0f");
//     GUSD = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd");
//     USDC = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
//     USDT = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20", "0xdac17f958d2ee523a2206206994597c13d831ec7");

//     uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");

//     //fill account 0
//     //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
//     //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,GUSD.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("10").toString()});
//     //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,USDC.address], await accounts[0].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});

//     //console.log("USDC Balance : "+(await USDC.balanceOf(await accounts[0].getAddress())).toString());
//     //console.log("Dai Balance : "+(await realDai.balanceOf(await accounts[0].getAddress())).toString());


//     const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
//     forwarder = await Forwarder.deploy(await accounts[0].getAddress());
//     await forwarder.deployed();

//     const TestRecipient = await ethers.getContractFactory("TestRecipient");
//     testRecipient = await TestRecipient.deploy(forwarder.address);
//     await testRecipient.deployed();

//     domainData = {
//       name: "TestRecipient",
//       version: "1",
//       verifyingContract: forwarder.address,
//       salt: ethers.utils.hexZeroPad(salt.toHexString(), 32)
//     };

//     await forwarder.registerDomainSeparator("TestRecipient", "1");
//     domainSeparator = ethers.utils.keccak256(
//       ethers.utils.defaultAbiCoder.encode(
//         ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
//         [
//           ethers.utils.id(
//             "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
//           ),
//           ethers.utils.id(domainData.name),
//           ethers.utils.id(domainData.version),
//           domainData.verifyingContract,
//           domainData.salt,
//         ]
//       )
//     );


//     //deploy fee multiplier with a factor of 1.5x
//     //deploy fee manager with a factor of 1.5x
//     const MockFeeManager = await ethers.getContractFactory("MockFeeManager");
//     mockFeeManager = await MockFeeManager.deploy(15000);
//     await mockFeeManager.deployed();

//     //deploy and fill up faucet
//     const Faucet = await ethers.getContractFactory("mockFaucet");
//     faucet = await Faucet.deploy();
//     await faucet.deployed();
//     await accounts[0].sendTransaction({
//       value: ethers.utils.parseEther("100"),
//       to: faucet.address
//     });

//     const ERC20Forwarder = await ethers.getContractFactory("ERC20Forwarder");
//     erc20Forwarder = await ERC20Forwarder.deploy(await accounts[0].getAddress());
//     await erc20Forwarder.deployed();
//     await erc20Forwarder.initialize(await accounts[0].getAddress(), mockFeeManager.address, forwarder.address);

//     await erc20Forwarder.setSafeTransferRequired(USDT.address, true);

//     await testnetDai.mint(await accounts[0].getAddress(), ethers.utils.parseEther("1000"));
//     await testnetDai.mint(await accounts[1].getAddress(), ethers.utils.parseEther("1000"));
//     await testnetDai.mint(await accounts[2].getAddress(), ethers.utils.parseEther("1000"));
//     await testnetDai.mint(await accounts[3].getAddress(), ethers.utils.parseEther("1000"));
//     await testnetDai.connect(accounts[0]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await testnetDai.connect(accounts[1]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await testnetDai.connect(accounts[2]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await testnetDai.connect(accounts[3]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await realDai.connect(accounts[0]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await realDai.connect(accounts[1]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await realDai.connect(accounts[2]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await realDai.connect(accounts[3]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDC.connect(accounts[0]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDC.connect(accounts[1]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDC.connect(accounts[2]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDC.connect(accounts[3]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await GUSD.connect(accounts[0]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await GUSD.connect(accounts[1]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await GUSD.connect(accounts[2]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await GUSD.connect(accounts[3]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDT.connect(accounts[0]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDT.connect(accounts[1]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDT.connect(accounts[2]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));
//     await USDT.connect(accounts[3]).approve(erc20Forwarder.address, ethers.utils.parseEther("1000"));

//     await mockFeeManager.setTokenAllowed(realDai.address, true);
//     await mockFeeManager.setTokenAllowed(USDC.address, true);
//     await mockFeeManager.setTokenAllowed(USDT.address, true);
//     await mockFeeManager.setTokenAllowed(GUSD.address, true);
//     await mockFeeManager.setTokenAllowed(testnetDai.address, true);

//   });

//   describe("Personal Sign", function () {

//     it("executes call successfully", async function () {
//       //await uniswapRouter.swapExactETHForTokens(0, [WETHAddress,realDai.address], await accounts[1].getAddress(), "10000000000000000000000",{value:ethers.utils.parseEther("1").toString()});
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[0].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = (ethers.utils.parseUnits('200', 'gwei')).toString();
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[0].signMessage(hashToSign);
//       await erc20Forwarder.executePersonalSign(req, sig);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//       req0 = req;
//     });

//     it("Updates nonces", async function () {
//       expect(await erc20Forwarder.getNonce(await accounts[0].getAddress(), 0)).to.equal(1);
//     });

//     it("Only pays relayers for the amount of gas used [ @skip-on-coverage ]", async function () {
//       const expectedMax = (ethers.BigNumber.from(req0.txGas * 1.5)).mul(ethers.BigNumber.from(req0.tokenGasPrice)); //gas*price*1.5
//       expect((await testnetDai.balanceOf(await accounts[0].getAddress())).lt(expectedMax)).to.equal(true);
//     });

//     it("Fails when nonce invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[0].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[0].signMessage(hashToSign);
//       await expect(erc20Forwarder.executePersonalSign(req, sig)).to.be.revertedWith();
//     });

//     it("Fails when signer invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[0].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[1].signMessage(hashToSign);
//       await expect(erc20Forwarder.executePersonalSign(req, sig)).to.be.revertedWith();
//     });

//   });

//   describe("EIP712", function () {

//     it("executes call successfully", async function () {
//       await erc20Forwarder.setFeeReceiver(await accounts[4].getAddress());
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = (ethers.utils.parseUnits('20', 'gwei')).toString();
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req
//       };
//       //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);
//       const sig = sigUtil.signTypedMessage(
//         new Buffer.from(privateKey, "hex"),
//         { data: dataToSign },
//         "V3"
//       );
//       await erc20Forwarder.executeEIP712(req, domainSeparator, sig);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//       req0 = req;
//     });

//     it("Updates nonces", async function () {
//       expect(await erc20Forwarder.getNonce(await accounts[1].getAddress(), 0)).to.equal(1);
//     });

//     it("Only pays relayers for the amount of gas used [ @skip-on-coverage ]", async function () {
//       const expectedMax = (ethers.BigNumber.from(req0.txGas * 1.5)).mul(ethers.BigNumber.from(req0.tokenGasPrice)); //gas*price*1.5
//       expect((await testnetDai.balanceOf(await accounts[4].getAddress())).lt(expectedMax)).to.equal(true);
//     });

//     it("Fails when nonce invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = (ethers.utils.parseUnits('20000', 'gwei')).toString();
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req
//       };
//       //const sig = await ethers.provider.send("eth_signTypedData", [req.from, dataToSign]);;
//       const sig = sigUtil.signTypedMessage(
//         new Buffer.from(privateKey, "hex"),
//         { data: dataToSign },
//         "V3"
//       );
//       await expect(erc20Forwarder.executeEIP712(req, domainSeparator, sig)).to.be.revertedWith();
//     });

//     it("Fails when signer invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 1;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = (ethers.utils.parseUnits('20000', 'gwei')).toString();
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req
//       };
//       //const sig = await ethers.provider.send("eth_signTypedData", [await accounts[0].getAddress(), dataToSign]);
//       const sig = sigUtil.signTypedMessage(
//         new Buffer.from(privateKey, "hex"),
//         { data: dataToSign },
//         "V3"
//       );
//       await expect(erc20Forwarder.executeEIP712(req, domainSeparator, sig)).to.be.revertedWith();
//     });

//   });

//   describe("Fee Transfer Handler", function () {
//     it("fee handler charges based on gas used, not req.gas [ @skip-on-coverage ]", async function () {
//       await erc20Forwarder.setFeeReceiver(await accounts[5].getAddress());
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[3].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = (ethers.utils.parseUnits('20000', 'gwei')).toString();
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[3].signMessage(hashToSign);
//       await erc20Forwarder.executePersonalSign(req, sig);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//       const expectedMax = (ethers.BigNumber.from(req.txGas * 1.5)).mul(ethers.BigNumber.from(req.tokenGasPrice)); //gas*price*1.5
//       expect((await testnetDai.balanceOf(await accounts[5].getAddress())).lt(expectedMax)).to.equal(true);
//     });

//     it("fee handler considers price correctly [ @skip-on-coverage ]", async function () {
//       const price0 = (ethers.utils.parseUnits('1', 'gwei')).toString();
//       const price1 = (ethers.utils.parseUnits('2', 'gwei')).toString();

//       await erc20Forwarder.setFeeReceiver(await accounts[6].getAddress());
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 2;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = price0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[1].signMessage(hashToSign);
//       await erc20Forwarder.executePersonalSign(req, sig);
//       const amountSpent = await testnetDai.balanceOf(await accounts[6].getAddress());

//       await erc20Forwarder.setFeeReceiver(await accounts[7].getAddress());
//       const req1 = await testRecipient.populateTransaction.nada();
//       req1.from = await accounts[1].getAddress();
//       req1.batchNonce = 0;
//       req1.batchId = 3;
//       req1.txGas = (req1.gasLimit).toNumber();
//       req1.tokenGasPrice = price1;
//       req1.deadline = 0;
//       delete req1.gasPrice;
//       delete req1.gasLimit;
//       delete req1.chainId;
//       req1.token = testnetDai.address;
//       const hashToSign1 = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req1.from, req1.to, req1.token, req1.txGas, req1.tokenGasPrice, req1.batchId, req1.batchNonce, req1.deadline,
//           ethers.utils.keccak256(req1.data)
//         ]);
//       const sig1 = await accounts[1].signMessage(hashToSign1);
//       await erc20Forwarder.executePersonalSign(req1, sig1);
//       const amountSpent1 = await testnetDai.balanceOf(await accounts[7].getAddress());
//       const expectedMax1 = (ethers.BigNumber.from(req1.txGas * 1.5)).mul(ethers.BigNumber.from(req1.tokenGasPrice)); //gas*price*1.5

//       expect((amountSpent1).lt(expectedMax1)).to.equal(true);
//       expect(Math.round(amountSpent1.toNumber() / amountSpent.toNumber())).to.equal(2);
//     });

//     it("fee handler considers multiplier correctly", async function () {

//       const price0 = (ethers.utils.parseUnits('1', 'gwei')).toString();

//       await erc20Forwarder.setFeeReceiver(await accounts[8].getAddress());
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 4;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = price0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[1].signMessage(hashToSign);
//       await erc20Forwarder.executePersonalSign(req, sig);
//       const amountSpent = await testnetDai.balanceOf(await accounts[8].getAddress());

//       await erc20Forwarder.setFeeReceiver(await accounts[9].getAddress());
//       await mockFeeManager.setFeeMultiplier(30000);
//       const req1 = await testRecipient.populateTransaction.nada();
//       req1.from = await accounts[1].getAddress();
//       req1.batchNonce = 0;
//       req1.batchId = 5;
//       req1.txGas = (req1.gasLimit).toNumber();
//       req1.tokenGasPrice = price0;
//       req1.deadline = 0;
//       delete req1.gasPrice;
//       delete req1.gasLimit;
//       delete req1.chainId;
//       req1.token = testnetDai.address;
//       const hashToSign1 = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req1.from, req1.to, req1.token, req1.txGas, req1.tokenGasPrice, req1.batchId, req1.batchNonce, req1.deadline,
//           ethers.utils.keccak256(req1.data)
//         ]);
//       const sig1 = await accounts[1].signMessage(hashToSign1);
//       await erc20Forwarder.executePersonalSign(req1, sig1);
//       const amountSpent1 = await testnetDai.balanceOf(await accounts[9].getAddress());
//       const expectedMax1 = (ethers.BigNumber.from(req1.txGas * 3)).mul(ethers.BigNumber.from(req1.tokenGasPrice)); //gas*price*3
//       expect((amountSpent1).lt(expectedMax1)).to.equal(true);
//       expect(Math.round(amountSpent1.toNumber() / amountSpent.toNumber())).to.equal(2);
//     });

//     it("transfers from correct address", async function () {
//       const price0 = (ethers.utils.parseUnits('1', 'gwei')).toString();

//       await erc20Forwarder.setFeeReceiver(await accounts[5].getAddress());
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 6;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = price0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[1].signMessage(hashToSign);
//       const balance0 = await testnetDai.balanceOf(await accounts[1].getAddress());
//       await erc20Forwarder.executePersonalSign(req, sig);
//       const balance1 = await testnetDai.balanceOf(await accounts[1].getAddress());
//       expect((balance1).lt(balance0)).to.equal(true);
//     });

//     it("Reverts requests which use non-permitted tokens", async function () {
//       await mockFeeManager.setTokenAllowed(testnetDai.address, false);
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 9;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[1].signMessage(hashToSign);
//       await expect(erc20Forwarder.executePersonalSign(req, sig)).to.be.revertedWith("TOKEN NOT ALLOWED BY FEE MANAGER");
//     });
//     //transfer handler gas amount added correctly to total gas charged
//     //transfers from correct token - validated implicitly from the other tests working
//     //transfers to correct address - when feeReceiver changed - validated implicitly from the other tests working
//     //transfers from correct address
//     //prevents transfers from banned tokens
//   });

//   describe("Token specific tests ", function () {
//     it("USDT", async function () {
//       await uniswapRouter.swapExactETHForTokens(0, [WETHAddress, USDT.address], await accounts[0].getAddress(), "10000000000000000000000", {
//         value: ethers.utils.parseEther("10").toString()
//       });
//       console.log("USDT Balance : " + (await USDT.balanceOf(await accounts[0].getAddress())).toString());
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[0].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = (req.gasLimit).toNumber();
//       req.tokenGasPrice = "1000";
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = USDT.address;
//       const hashToSign = abi.soliditySHA3(['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
//         [req.from, req.to, req.token, req.txGas, req.tokenGasPrice, req.batchId, req.batchNonce, req.deadline,
//           ethers.utils.keccak256(req.data)
//         ]);
//       const sig = await accounts[0].signMessage(hashToSign);
//       await erc20Forwarder.executePersonalSign(req, sig);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//       req0 = req;
//     })
//   })

// })