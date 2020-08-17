/** const shouldFail = require("./helpers/shouldFail");

var EthUtil = require('ethereumjs-util');

const IdentityProxyManager = artifacts.require("IdentityProxyManager");
const IdentityProxy = artifacts.require("IdentityProxy");

contract("IdentityProxyManager", function([_, owner,relayerAddress,anotherAddress,proxyOwner,receiver]) {

	const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
	const ONLY_RELAYER_MESSAGE = "Only Relayer account is allowed to perform this operation";
	const ONLY_PROXY_OWNER_MESSAGE = "Only Proxy account owner is allowed to perform this operation";
	let identityProxyManager;
	let relayers=[relayerAddress];
	
	let amount=1;

	// var _signature = "0x0037d81b25d4620a7c6472e5be95a26c5c9bca8772ebc8f3e371e881835c5aff7c14385550075adafb363b110317002dcc78e928d504d6427696aa7477f7b5511c";
	var messageToSign="itsMeDivya";
	beforeEach('setup IdentityProxyManager for each test', async function () {
		identityProxyManager = await IdentityProxyManager.new({from: owner});
		await identityProxyManager.addRelayers(relayers, {from: owner});
    	});

	// describe("Withdraw", function(){
	// 	it("Test when Withdraw method is not called by Relayer", async()=>{
	// 		await shouldFail.revertWithMessage(identityProxyManager.withdraw(_signature,messageToSign,proxyOwner,receiver,amount,"You are not allowed to perform this operation"));
	// 	});

	// 	it("Test When Withdraw method is called by Relayer", async()=>{
	// 		await identityProxyManager.createIdentityProxy(proxyOwner, {from: relayerAddress});
	// 		let proxyAddress= await identityProxyManager.getProxyAddress(proxyOwner);
	// 		let proxyInstance= await IdentityProxy.at(proxyAddress);
	// 		await proxyInstance.send(10, {from: proxyOwner});
	// 		await identityProxyManager.withdraw(_signature,messageToSign,proxyOwner,receiver,amount,{from : relayerAddress});
	// 	});

	// });
	describe("forward",function(){
		it("Test if Withdraw method called by Relayer", async()=>{
			//Owner Signature code needs to be implemented
		});

	});
	describe("transfer Erc Token",function(){
		it("Test if Withdraw method called by Relayer", async()=>{
			//Owner Signature code needs to be implemented
		});

	});

	describe("Relayer", function(){
		it("check Relayer", async()=>{
			assert.isTrue(await identityProxyManager.getRelayerStatus(relayerAddress), "Relayer not initialised in constructor");
		});

		it("addRelayers called by owner", async()=>{
			let relayerArray=[anotherAddress];
			await identityProxyManager.addRelayers(relayerArray, {from: owner});
			assert.isTrue(await identityProxyManager.getRelayerStatus(anotherAddress), "Relayer not added properly");
		});

		it("Test if Relayer address is not 0", async()=>{
			let zeroAddressRelayer=[ZERO_ADDRESS];
			await shouldFail.revertWithMessage(identityProxyManager.addRelayers(zeroAddressRelayer, {from: owner}), 
				"Relayer address cannot be zero");
		});

		it("add Relayer called by non-owner", async()=>{
			let relayerArray=[anotherAddress];
			await shouldFail.reverting(identityProxyManager.addRelayers(relayerArray));
		});

		it("Test if relayer is stored properly", async() => {
			let relayerArray=[anotherAddress];
			await identityProxyManager.addRelayers(relayerArray, {from: owner});
			let relayers=await identityProxyManager.getAllRelayers();
			assert.isTrue(relayers.includes(anotherAddress), "Relayer added properly.");
		});
	});

	describe("Proxy Contract", function(){
		it("Test Proxy Contract is created successfully", async()=>{
			await identityProxyManager.createIdentityProxy(proxyOwner, {from: relayerAddress});
			let proxyAddress= await identityProxyManager.proxyOwnerMap(proxyOwner);
			let proxyAddressStatus= await identityProxyManager.proxyOwners(proxyOwner,proxyAddress);
			assert.isTrue(proxyAddressStatus, "Proxy not added properly");

			let proxyInstance= await IdentityProxy.at(proxyAddress);
			assert.isFalse(proxyInstance==null || proxyInstance == undefined,"Proxy not added properly");
		});

		it("Test Proxy Contract is called by Relayer", async()=>{
			await identityProxyManager.createIdentityProxy(proxyOwner, {from: relayerAddress});
			let proxyAddressFromMap= await identityProxyManager.proxyOwnerMap(proxyOwner);
			let proxyAddress= await identityProxyManager.getProxyAddress(proxyOwner);
			assert.isTrue(proxyAddressFromMap==proxyAddress, "Proxy address do not match");
		});

		it("Test Proxy Contract is not called by Relayer", async() => {
			await shouldFail.reverting(identityProxyManager.createIdentityProxy(anotherAddress));
		});

		it("Test if Owner address is not 0", async() => {
			await shouldFail.revertWithMessage(identityProxyManager.createIdentityProxy(ZERO_ADDRESS, {from: relayerAddress},
				"Address cannot be 0"));
		});
	});
});
**/