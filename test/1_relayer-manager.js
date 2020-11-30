let shouldFail = require("./helpers/shouldFail");
let RelayerManager = artifacts.require("RelayerManager");

contract("RelayerManager", function([_, owner, notOwner, relayer1, relayer2, relayer3]) {
	let relayerManager;

	before('before', async function () {
        relayerManager = await RelayerManager.new(owner);
	});

	describe("Test Relayer manager methods", function(){

		it("Should addRelayers array successfully", async()=>{
            await relayerManager.addRelayers([ relayer1 ],{from: owner});
            let relayers = await relayerManager.getAllRelayers();

            assert.isTrue(relayers[0] == relayer1, "Relayers1 added successfully");
        });

        it("Should fail to addRelayers - only owner can perform ", async()=>{
           await shouldFail.revertWithMessage(relayerManager.addRelayers([ relayer1 ],{from: notOwner}), "Only contract owner is allowed to perform this operation");
        });

        it("Should fail if add existing relayer via addRelayer", async() => {
            await relayerManager.addRelayer(relayer3, {from: owner});
            await shouldFail.revertWithMessage(relayerManager.addRelayer(relayer3, {from: owner}), "Can not add already added relayer");
        });

        it("Should fail if add existing relayer via addRelayers", async() => {
            await shouldFail.revertWithMessage(relayerManager.addRelayers([relayer3], {from: owner}), "Can not add already added relayer");
        });

        it("Should addRelayer successfully", async()=>{
            await relayerManager.addRelayer( relayer2, {from: owner} );
            let relayerStatus = await relayerManager.getRelayerStatus( relayer2 );

            assert.isTrue(relayerStatus == true, "Relayers2 added successfully");
        });

        it("Should fail to addRelayer - only owner can perform ", async()=>{
            await shouldFail.revertWithMessage(relayerManager.addRelayer( relayer1 ,{from: notOwner}), "Only contract owner is allowed to perform this operation");
        });

	});
});
