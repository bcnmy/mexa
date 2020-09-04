const shouldFail = require("./helpers/shouldFail");
const GasTokenForwarder = artifacts.require("GasTokenForwarder");
const MockedChiToken = artifacts.require("MockedChiToken");
const RelayerManager = artifacts.require("RelayerManager");

contract("GasTokenForwarder", function([_, owner,relayerManagerAddress, destination]) {

	const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
	let gasTokenForwarder;
	let chiToken;
	let tokenToMint = 250;
	let tokenToFree = 200;
	let relayerManager;
	
	before('beforeEach', async function () {
		chiToken = await MockedChiToken.new({from: owner});
		relayerManager = await RelayerManager.new({from: owner});
		gasTokenForwarder = await GasTokenForwarder.new(owner, chiToken.address, relayerManager.address, {from: owner});
	});

	describe("Call Forward Method", function(){
		it("Should be able to Free tokens", async()=>{
			await relayerManager.addRelayer(relayerManagerAddress, {from: owner});
			await gasTokenForwarder.forward(destination, "0x0", 10000000000, 2100000,{from: relayerManagerAddress});
		});
	});
	
	describe("RelayerManager", function(){
		it("Should be able to add new RelayerManager", async()=>{
			await gasTokenForwarder.addRelayerManager(relayerManagerAddress,{from: owner});
			let newRelayerManger = await gasTokenForwarder._relayerManager.call();
			assert.isTrue(newRelayerManger == relayerManagerAddress, "addRelayerManager not added");
		});
		it("Should throw error if RelayerManager address is 0", async()=>{
			let zeroAddressRelayer = ZERO_ADDRESS;
			shouldFail.revertWithMessage(gasTokenForwarder.addRelayerManager(zeroAddressRelayer,{from: owner}), "Manager address can not be 0");
		});
	});

	describe("Mint Gas Token", function(){
		it("Should be able to mint tokens", async()=>{
			await gasTokenForwarder.mintGasToken(tokenToMint,{from: owner});
			let tokenBalance = await gasTokenForwarder.balanceOfGasToken(gasTokenForwarder.address);
			assert.isTrue(tokenBalance == tokenToMint, "Token minted Successfully");
		});
	});

	describe("Free Gas Token", function(){
		it("Should be able to Free tokens", async()=>{
			await gasTokenForwarder.mintGasToken(tokenToMint,{from: owner});
			let tokenBalanceAfterMint = await gasTokenForwarder.balanceOfGasToken(gasTokenForwarder.address);

			await gasTokenForwarder.freeGasToken(tokenToFree,{from: owner});
			let tokenBalanceAfterBurn = await gasTokenForwarder.balanceOfGasToken(gasTokenForwarder.address);
			
			assert.isTrue((tokenBalanceAfterMint.toNumber() -tokenBalanceAfterBurn.toNumber())==tokenToFree, "Token freed Successfully");
		});
	});
});
