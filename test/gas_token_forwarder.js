const shouldFail = require("./helpers/shouldFail");
const GasTokenForwarder = artifacts.require("GasTokenForwarder");
const GasTokenImplementation = artifacts.require("GasTokenImplementation");
const MockedChiToken = artifacts.require("MockedChiToken");
const RelayerManager = artifacts.require("RelayerManager");
const web3Abi = require('web3-eth-abi');

contract("GasTokenForwarder", function([_, owner,relayerManagerAddress, implementationAddress, chiTokenAddress, notOwner, destination]) {

	const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
	let gasTokenForwarder;
	let gasTokenImplementation;
	let chiToken;
	let tokenToMint = 250;
	let tokenToFree = 200;
	let relayerManager;
	let mintAbi = { "constant": false, "inputs": [ { "internalType": "uint256", "name": "mint", "type": "uint256" } ], "name": "mintGasToken", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let forwardAbi = { "constant": false, "inputs": [ { "internalType": "address payable", "name": "destination", "type": "address" }, { "internalType": "bytes", "name": "data", "type": "bytes" }, { "internalType": "uint256", "name": "gasLimit", "type": "uint256" } ], "name": "forward", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" };

	before('before', async function () {
		chiToken = await MockedChiToken.new({from: owner});
		relayerManager = await RelayerManager.new({from: owner});
		gasTokenImplementation = await GasTokenImplementation.new({from: owner});
		gasTokenForwarder = await GasTokenForwarder.new(owner, chiToken.address, relayerManager.address,gasTokenImplementation.address, {from: owner});
	});

	describe("Mint and Fetch Balance", function(){
		it("Should be able to Mint and get token Balance", async()=>{
			const mintGasTokenData = web3Abi.encodeFunctionCall(
				mintAbi,
				[tokenToMint]
			);
			await gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: owner, 
				gas: 500000,
				data: mintGasTokenData
			 });
			let tokenBalance = await gasTokenForwarder.balanceOfGasToken(gasTokenForwarder.address);
			assert.isTrue(tokenBalance.toNumber() === tokenToMint, "Token minted Successfully");
		});

		it("Only owner can mint", async()=>{
			const mintGasTokenData = web3Abi.encodeFunctionCall(
				mintAbi,
				[tokenToMint]
			);
			shouldFail.revertWithMessage(gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: mintGasTokenData
			 }),"You are not allowed to perform this operation"
			)
		});
	});

	describe("Foward Transaction", function(){
		it("Should be able to forward transaction", async()=>{
			const forwardTokenData = web3Abi.encodeFunctionCall(
				forwardAbi,
				[destination,"0x0",210000]
			);
			await gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: owner, 
				gas: 500000,
				data: forwardTokenData
			 });
		});

		it("Only owner can call forward method", async()=>{
			const forwardTokenData = web3Abi.encodeFunctionCall(
				forwardAbi,
				[destination,"0x0",210000]
			);
			await 
			shouldFail.revertWithMessage(gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: forwardTokenData
			 }),"You are not allowed to perform this operation"
			)
		});
	});

	describe("Add Relayer Manager Contract", function(){
		it("Only Owner should be able add Relayer Manager", async()=>{
			await gasTokenForwarder.addRelayerManager(relayerManagerAddress, {from: owner});
			let _relayerManagerAddress = await gasTokenForwarder.relayerManager.call();
			assert.isTrue(_relayerManagerAddress == relayerManagerAddress, "Relayer Manager not added");
		});
		it("Anyone other then Owner should not be able add relayer", async()=>{
			shouldFail.revertWithMessage(gasTokenForwarder.addRelayerManager(relayerManagerAddress, {from: notOwner}), "Only contract owner is allowed to perform this operation");
		});
		it("Relayer manager address should not be Zero", async()=>{
			shouldFail.revertWithMessage(gasTokenForwarder.addRelayerManager(ZERO_ADDRESS,{from: owner}), "Manager address can not be 0");
		});
	});

	describe("Add Implementation Contract", function(){
		it("Only Owner should be able add Implementation Contract", async()=>{
			await gasTokenForwarder.addGasTokenImpl(implementationAddress, {from: owner});
			let _implementationAddress = await gasTokenForwarder.gasTokenImplementation.call();
			assert.isTrue(_implementationAddress == implementationAddress, "Implementation Contract not added");
		});
		it("Anyone other then Owner should not be able add Implementation Contract", async()=>{
			shouldFail.revertWithMessage(gasTokenForwarder.addGasTokenImpl(implementationAddress, {from: notOwner}), "Only contract owner is allowed to perform this operation");
		});
		it("Implementation Contract address should not be Zero", async()=>{
			shouldFail.revertWithMessage(gasTokenForwarder.addGasTokenImpl(ZERO_ADDRESS,{from: owner}), "Implementation Contract address can not be 0");
		});
	});

	describe("Add Chi Contract", function(){
		it("Only Owner should be able add ChiToken Contract", async()=>{
			await gasTokenForwarder.addChiAddress(chiTokenAddress, {from: owner});
			let _chiTokenAddress = await gasTokenForwarder.chiToken.call();
			assert.isTrue(_chiTokenAddress == chiTokenAddress, "chiToken Contract not added");
		});
		it("Anyone other then Owner should not be able add ChiToken Contract", async()=>{
			shouldFail.revertWithMessage(gasTokenForwarder.addChiAddress(chiTokenAddress, {from: notOwner}), "Only contract owner is allowed to perform this operation");
		});
		it("ChiToken Contract address should not be Zero", async()=>{
			shouldFail.revertWithMessage(gasTokenForwarder.addChiAddress(ZERO_ADDRESS,{from: owner}), "ChiTokenAddress contract address can not be 0");
		});
	});
});
