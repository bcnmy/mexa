// const { expect } = require("chai");
// const abi = require("ethereumjs-abi");

// describe("Biconomy Forwarder", function () {
//   let accounts;
//   let forwarder;
//   let testRecipient;
//   let domainData;
//   let domainSeparator;
//   let testnetDai;
//   let mockFeeManager;
//   let faucet;

//   let domainType = [
//     { name: "name", type: "string" },
//     { name: "version", type: "string" },
//     { name: "verifyingContract", type: "address" },
//     { name: "salt", type: "bytes32" }
//   ];

//   let erc20ForwardRequest = [
//     { name: "from", type: "address" },
//     { name: "to", type: "address" },
//     { name: "token", type: "address" },
//     { name: "txGas", type: "uint256" },
//     { name: "tokenGasPrice", type: "uint256" },
//     { name: "batchId", type: "uint256" },
//     { name: "batchNonce", type: "uint256" },
//     { name: "deadline", type: "uint256" },
//     { name: "data", type: "bytes" },
//   ];

//   const salt = ethers.BigNumber.from(31337);

//   before(async function () {
//     accounts = await ethers.getSigners();

//     const owner = await accounts[0].getAddress();

//     const TestnetDai = await ethers.getContractFactory("TestnetDAI");
//     testnetDai = await TestnetDai.deploy();
//     await testnetDai.deployed();

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

//     //deploy fee manager with a factor of 1.2x
//     const MockFeeManager = await ethers.getContractFactory("MockFeeManager");
//     mockFeeManager = await MockFeeManager.deploy(12000);
//     await mockFeeManager.deployed();

//     //deploy and fill up faucet
//     const Faucet = await ethers.getContractFactory("mockFaucet");
//     faucet = await Faucet.deploy();
//     await faucet.deployed();
//     await accounts[0].sendTransaction({
//       value: ethers.utils.parseEther("100"),
//       to: faucet.address,
//     });
//   });

//   describe("personal sign", function () {
//     it("executes call successfully", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[1].signMessage(hashToSign);
//       const tx = await forwarder.executePersonalSign(req, sig);
//       const receipt = await tx.wait(confirmations = 1);
//       console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//     });

//     it("executes call successfully", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 1;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[1].signMessage(hashToSign);
//       const tx = await forwarder.executePersonalSign(req, sig);
//       const receipt = await tx.wait(confirmations = 1);
//       console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//     });

//     it("executes call successfully", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 2;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[1].signMessage(hashToSign);
//       const tx = await forwarder.executePersonalSign(req, sig);
//       const receipt = await tx.wait(confirmations = 1);
//       console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//     });

//     it("reverts with bubbled up error message", async function () {
//       const req = await testRecipient.populateTransaction.nadaRevert();
//       req.from = await accounts[11].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[11].signMessage(hashToSign);
//       await expect(forwarder.executePersonalSign(req, sig)).to.be.revertedWith(
//         "custom force revert"
//       );
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//     });

//     it("Updates nonces", async function () {
//       expect(
//         await forwarder.getNonce(await accounts[1].getAddress(), 0)
//       ).to.equal(3);
//     });

//     /*it("Transfers any funds received to the 'from address'", async function () {
//       const rwallet = ethers.Wallet.createRandom();
//       const req = await faucet.populateTransaction.payUp(
//         forwarder.address,
//         ethers.utils.parseEther("1").toString()
//       );
//       req.from = await rwallet.getAddress();
//       req.txGas = 21000;
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await rwallet.signMessage(hashToSign);
//       await forwarder.executePersonalSign(req, sig);
//       expect((await ethers.provider.getBalance(req.from)).toString()).to.equal(
//         ethers.utils.parseEther("1")
//       );
//     });*/

//     it("Fails when nonce invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[1].signMessage(hashToSign);
//       await expect(
//         forwarder.executePersonalSign(req, sig)
//       ).to.be.revertedWith();
//     });

//     it("Fails when signer invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 1;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[0].signMessage(hashToSign);
//       await expect(
//         forwarder.executePersonalSign(req, sig)
//       ).to.be.revertedWith();
//     });

//     it("External verify function validates compliant requests/signatures as correct", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 19;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[1].signMessage(hashToSign);
//       await forwarder.callStatic.verifyPersonalSign(req, sig);
//     });

//     it("External verify function validates non-compliant requests/signatures as incorrect", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 1;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[2].signMessage(hashToSign);
//       await expect(
//         forwarder.callStatic.verifyPersonalSign(req, sig)
//       ).to.be.revertedWith();
//     });

//     it("Fails when deadline non-zero and below current time", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 2;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 1;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[1].signMessage(hashToSign);
//       await expect(
//         forwarder.executePersonalSign(req, sig)
//       ).to.be.revertedWith();
//     });

//     it("Executes successfully when deadline is above current time", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 2;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = Math.floor(Date.now() / 1000) + 600;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       const hashToSign = abi.soliditySHA3(
//         [
//           "address",
//           "address",
//           "address",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "uint256",
//           "bytes32",
//         ],
//         [
//           req.from,
//           req.to,
//           req.token,
//           req.txGas,
//           req.tokenGasPrice,
//           req.batchId,
//           req.batchNonce,
//           req.deadline,
//           ethers.utils.keccak256(req.data),
//         ]
//       );
//       const sig = await accounts[1].signMessage(hashToSign);
//       const tx = await forwarder.executePersonalSign(req, sig);
//       const receipt = await tx.wait(confirmations = 1);
//       console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
//     });
//   });

//   describe("EIP712", function () {
//     it("executes call successfully", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);;
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       const tx = await forwarder.executeEIP712(req, domainSeparator, sig);
//       const receipt = await tx.wait(confirmations = 1);
//       console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//     });

//     it("executes call successfully", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 1;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);;
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       const tx = await forwarder.executeEIP712(req, domainSeparator, sig);
//       const receipt = await tx.wait(confirmations = 1);
//       console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//     });

//     it("executes call successfully", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 2;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);;
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       const tx = await forwarder.executeEIP712(req, domainSeparator, sig);
//       const receipt = await tx.wait(confirmations = 1);
//       console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
//       //expect(await testRecipient.callsMade(req.from)).to.equal(1);
//     });


//     it("Updates nonces", async function () {
//       expect(
//         await forwarder.getNonce(await accounts[2].getAddress(), 0)
//       ).to.equal(3);
//     });

//     /*it("Transfers any funds received to the 'from address'", async function () {
//       const req = await faucet.populateTransaction.payUp(
//         forwarder.address,
//         ethers.utils.parseEther("1").toString()
//       );
//       req.from = await accounts[3].getAddress();
//       req.txGas = 21000;
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.tokenGasPrice = 0;
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
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       const preBalance = await ethers.provider.getBalance(req.from);
//       await forwarder.executeEIP712(req, domainSeparator, sig, {
//         value: req.msgValue,
//       });
//       expect(
//         (await ethers.provider.getBalance(req.from)).sub(preBalance).toString()
//       ).to.equal(ethers.utils.parseEther("1"));
//     });*/

//     it("Fails when nonce invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);;
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       await expect(
//         forwarder.executeEIP712(req, domainSeparator, sig)
//       ).to.be.revertedWith();
//     });

//     it("Fails when signer invalid", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 0;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);;
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         await accounts[3].getAddress(),
//         dataToSign,
//       ]);
//       await expect(
//         forwarder.executeEIP712(req, domainSeparator, sig)
//       ).to.be.revertedWith();
//     });

//     it("External verify function validates compliant requests/signatures as correct", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 19;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 0;
//       delete req.gasPrice;
//       delete req.gasLimit;
//       delete req.chainId;
//       req.token = testnetDai.address;
//       // const erc20fr = Object.assign({}, req);;
//       // erc20fr.dataHash = ethers.utils.keccak256(erc20fr.data);
//       // delete erc20fr.data;
//       const dataToSign = {
//         types: {
//           EIP712Domain: domainType,
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       await forwarder.callStatic.verifyEIP712(req, domainSeparator, sig);
//     });

//     it("External verify function validates non-compliant requests/signatures as incorrect", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[1].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 1;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
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
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         await accounts[2].getAddress(),
//         dataToSign,
//       ]);
//       await expect(
//         forwarder.callStatic.verifyEIP712(req, domainSeparator, sig)
//       ).to.be.revertedWith();
//     });

//     it("Fails when deadline non-zero and below current time", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 2;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = 1;
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
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       await expect(
//         forwarder.executeEIP712(req, domainSeparator, sig)
//       ).to.be.revertedWith();
//     });

//     it("Executes successfully when deadline is above current time", async function () {
//       const req = await testRecipient.populateTransaction.nada();
//       req.from = await accounts[2].getAddress();
//       req.batchNonce = 0;
//       req.batchId = 2;
//       req.txGas = req.gasLimit.toNumber();
//       req.tokenGasPrice = 0;
//       req.deadline = Math.floor(Date.now() / 1000) + 600;
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
//           ERC20ForwardRequest: erc20ForwardRequest,
//         },
//         domain: domainData,
//         primaryType: "ERC20ForwardRequest",
//         message: req,
//       };
//       const sig = await ethers.provider.send("eth_signTypedData", [
//         req.from,
//         dataToSign,
//       ]);
//       await forwarder.executeEIP712(req, domainSeparator, sig);
//     });
//   });

//   describe("Domain Separators", function () {
//     it("Adds domain separators created via registerDomainSeparator to its registry", async function () {
//       const exampleDomain = {
//         name: "BiconomyForwarder",
//         version: "1",
//         verifyingContract: forwarder.address,
//         salt: ethers.utils.hexZeroPad(salt.toHexString(), 32)
//       };

//       await forwarder.registerDomainSeparator("BiconomyForwarder", "1");
//       const exampleDomainSeparator = ethers.utils.keccak256(
//         ethers.utils.defaultAbiCoder.encode(
//           ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
//           [
//             ethers.utils.id(
//               "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
//             ),
//             ethers.utils.id(exampleDomain.name),
//             ethers.utils.id(exampleDomain.version),
//             exampleDomain.verifyingContract,
//             exampleDomain.salt,
//           ]
//         )
//       );
//       expect(await forwarder.domains(exampleDomainSeparator)).to.equal(true);
//     });
//     it("Domain separators are invalid when address is altered", async function () {
//       const exampleDomain = {
//         name: "BiconomyForwarder",
//         version: "1",
//         verifyingContract: testnetDai.address,
//         salt: ethers.utils.hexZeroPad(salt.toHexString(), 32)
//       };

//       await forwarder.registerDomainSeparator("BiconomyForwarder", "1");
//       const exampleDomainSeparator = ethers.utils.keccak256(
//         ethers.utils.defaultAbiCoder.encode(
//           ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
//           [
//             ethers.utils.id(
//               "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
//             ),
//             ethers.utils.id(exampleDomain.name),
//             ethers.utils.id(exampleDomain.version),
//             exampleDomain.verifyingContract,
//             exampleDomain.salt,
//           ]
//         )
//       );
//       expect(await forwarder.domains(exampleDomainSeparator)).to.equal(false);
//     });
//     it("Domain separators are invalid when chainId is altered", async function () {

//       const invalidSalt = ethers.BigNumber.from(69);

//       const exampleDomain = {
//         name: "BiconomyForwarder",
//         version: "1",
//         verifyingContract: forwarder.address,
//         salt: ethers.utils.hexZeroPad(invalidSalt.toHexString(), 32)
//       };

//       await forwarder.registerDomainSeparator("BiconomyForwarder", "1");
//       const exampleDomainSeparator = ethers.utils.keccak256(
//         ethers.utils.defaultAbiCoder.encode(
//           ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
//           [
//             ethers.utils.id(
//               "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
//             ),
//             ethers.utils.id(exampleDomain.name),
//             ethers.utils.id(exampleDomain.version),
//             exampleDomain.verifyingContract,
//             exampleDomain.salt,
//           ]
//         )
//       );
//       expect(await forwarder.domains(exampleDomainSeparator)).to.equal(false);
//     });
//   });
// });
