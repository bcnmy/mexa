let RelayerManager = artifacts.require("RelayerManager");
let shouldFail = require("./helpers/shouldFail");
const GasTokenForwarder = artifacts.require("GasTokenForwarder");
const GasTokenImplementation = artifacts.require("GasTokenImplementation");
const MockedChiToken = artifacts.require("MockedChiToken");
const web3Abi = require('web3-eth-abi');

contract("GasTokenForwarder", function([_, owner,relayerManagerAddress, implementationAddress, chiTokenAddress, notOwner, destination, newChiOwner, spender]) {

	const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
	let gasTokenForwarder;
	let gasTokenImplementation;
	let chiToken;
	let tokenToMint = 250;
	let relayerManager;
	let mintAbi = { "constant": false, "inputs": [ { "internalType": "uint256", "name": "mint", "type": "uint256" } ], "name": "mintGasToken", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let forwardAbi = { "constant": false, "inputs": [ { "internalType": "address payable", "name": "destination", "type": "address" }, { "internalType": "bytes", "name": "data", "type": "bytes" }, { "internalType": "uint256", "name": "gasLimit", "type": "uint256" } ], "name": "forward", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let chiExceptionMethodAbi = { "constant": false, "inputs": [], "name": "throwException", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let transferChiAbi = { "constant": false, "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "transferGasToken", "outputs": [ { "internalType": "bool", "name": "success", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let transferFromChiAbi = { "constant": false, "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "transferGasTokenFrom", "outputs": [ { "internalType": "bool", "name": "success", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let approveChiAbi = { "constant": false, "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "approveGasToken", "outputs": [ { "internalType": "bool", "name": "success", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let freeFromChiAbi = { "constant": false, "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "freeGasTokenFrom", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" };
	let freeFromUptoAbi = { "constant": false, "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "freeGasTokenFromUpTo", "outputs": [ { "internalType": "uint256", "name": "freed", "type": "uint256" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" };

	before('before', async function () {
		chiToken = await MockedChiToken.new({from: owner});
		relayerManager = await RelayerManager.new({from: owner});
		gasTokenImplementation = await GasTokenImplementation.new({from: owner});
		gasTokenForwarder = await GasTokenForwarder.new(owner, chiToken.address, relayerManager.address, gasTokenImplementation.address, {from: owner});
	});

	// after('after', async function(){
	// 	relayerManager = null;
	// });

	describe("Test Chi methods", function(){

		it("Test approve method- success", async()=>{
			let approveGasTokenData = web3Abi.encodeFunctionCall(
				approveChiAbi,
				[newChiOwner, 5]
			);
			let isSuccess = await gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: owner, 
				gas: 500000,
				data: approveGasTokenData
			});
			
			assert.isTrue(isSuccess.receipt.status, "Token approved Successfully");
		});

		it("Test approve method- Only owner is allowed", async()=>{
			let approveGasTokenData = web3Abi.encodeFunctionCall(
				approveChiAbi,
				[newChiOwner, 5]
			);

			shouldFail.revertWithMessage(gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: approveGasTokenData
			}),"You are not allowed to perform this operation")			
		});

		it("Test transferGasToken method- success", async()=>{
			let transferFromGasTokenData = web3Abi.encodeFunctionCall(
				transferFromChiAbi,
				[gasTokenForwarder.address, newChiOwner, 5]
			);
			let isSuccess = await gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: owner, 
				gas: 500000,
				data: transferFromGasTokenData
			});
			
			assert.isTrue(isSuccess.receipt.status, "Token transferred Successfully");
		});

		it("Test transferGasToken method- Only owner is allowed", async()=>{
			let transferFromGasTokenData = web3Abi.encodeFunctionCall(
				transferFromChiAbi,
				[gasTokenForwarder.address, newChiOwner, 5]
			);

			shouldFail.revertWithMessage(gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: transferFromGasTokenData
			}),"You are not allowed to perform this operation")			
		});

		it("Test transferGasToken method- success", async()=>{
			let transferGasTokenData = web3Abi.encodeFunctionCall(
				transferChiAbi,
				[newChiOwner, 5]
			);
			let isSuccess = await gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: owner, 
				gas: 500000,
				data: transferGasTokenData
			});			
			assert.isTrue(isSuccess.receipt.status, "Token transferred Successfully");
		});

		it("Test transferGasToken method- Only owner is allowed", async()=>{
			let transferGasTokenData = web3Abi.encodeFunctionCall(
				transferChiAbi,
				[newChiOwner, 5]
			);

			shouldFail.revertWithMessage(gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: transferGasTokenData
			}),"You are not allowed to perform this operation")			
		});

		it("Test Free From method- success", async()=>{
			let freeFromGasTokenData = web3Abi.encodeFunctionCall(
				freeFromChiAbi,
				[gasTokenForwarder.address, 2]
			);
			let isSuccess = await gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: owner, 
				gas: 500000,
				data: freeFromGasTokenData
			});
			
			assert.isTrue(isSuccess.receipt.status, "Token freed Successfully");
		});
		it("Test Free From method- Only owner is allowed", async()=>{
			let freeFromGasTokenData = web3Abi.encodeFunctionCall(
				freeFromChiAbi,
				[gasTokenForwarder.address, 2]
			);
			shouldFail.revertWithMessage(gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: freeFromGasTokenData
			}),"You are not allowed to perform this operation")	
		});

		it("Test FreeFrom upto method- success", async()=>{
			let freeFromUptoGasTokenData = web3Abi.encodeFunctionCall(
				freeFromUptoAbi,
				[gasTokenForwarder.address,2]
			);
			let isSuccess = await gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: owner, 
				gas: 500000,
				data: freeFromUptoGasTokenData
			});
			
			assert.isTrue(isSuccess.receipt.status, "Token free Successfully");
		});
		it("Test FreeFrom upto method- Only owner is allowed", async()=>{
			let freeFromUptoGasTokenData = web3Abi.encodeFunctionCall(
				freeFromUptoAbi,
				[gasTokenForwarder.address,2]
			);
			shouldFail.revertWithMessage(gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: freeFromUptoGasTokenData
			}),"You are not allowed to perform this operation")	
		});

		it("Test allowance method- success", async()=>{
			let tokenAllownace = await gasTokenForwarder.allowance( owner, spender );
			assert.isTrue(tokenAllownace.toNumber() == 2, "Token allowance done Successfully");
		});
	});

	describe("Mint and Fetch Balance", function(){
		
		it("Should be able to Mint and get token Balance", async()=>{
			let mintGasTokenData = web3Abi.encodeFunctionCall(
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
			let mintGasTokenData = web3Abi.encodeFunctionCall(
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
			let forwardTokenData = web3Abi.encodeFunctionCall(
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
		it("Should fail forward transaction", async()=>{

			let FailedData = web3Abi.encodeFunctionCall(
				chiExceptionMethodAbi,
				[]
			);
			let forwardTokenData = web3Abi.encodeFunctionCall(
				forwardAbi,
				[destination,FailedData,210000]
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
			 
			shouldFail.revertWithMessage(
				gasTokenForwarder.sendTransaction({ 
				value: 0, 
				from: notOwner, 
				gas: 500000,
				data: forwardTokenData
			 })
			 ,"You are not allowed to perform this operation"
			)
		});
	});

	// describe("Add Relayer Manager Contract", function(){
	// 	it("Only Owner should be able add Relayer Manager", async()=>{
	// 		await gasTokenForwarder.addRelayerManager(relayerManagerAddress, {from: owner});
	// 		let _relayerManagerAddress = await gasTokenForwarder.relayerManager.call();
	// 		assert.isTrue(_relayerManagerAddress == relayerManagerAddress, "Relayer Manager not added");
	// 	});
	// 	it("Anyone other then Owner should not be able add relayer", async()=>{
	// 		shouldFail.revertWithMessage(gasTokenForwarder.addRelayerManager(relayerManagerAddress, {from: notOwner}), "Only contract owner is allowed to perform this operation");
	// 	});
	// 	it("Relayer manager address should not be Zero", async()=>{
	// 		shouldFail.revertWithMessage(gasTokenForwarder.addRelayerManager(ZERO_ADDRESS,{from: owner}), "Manager address can not be 0");
	// 	});
	// });

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
