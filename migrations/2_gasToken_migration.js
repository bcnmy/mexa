const GasTokenForwarder = artifacts.require("GasTokenForwarder");
const GasTokenImplementation = artifacts.require("GasTokenImplementation");
var RelayerManager = artifacts.require("RelayerManager");

module.exports = function(deployer) {
    // Owner of GasTokenForwarder Contract
    var owner = "0x256144a60f34288F7b03D345F8Cb256C502e0f2C";

    //Chi token address on Kovan and Mainnet is same. Replace if deploying on another address
    // var ChiAddress = "0x0000000000004946c0e9f43f4dee607b0ef1fa1c";

    //Chi token address on Ropsten;
    var ChiAddress = "0x063f83affbCF64D7d84d306f5B85eD65C865Dca4";

    // Make sure Relayer manager is not already deployed using the other script.
    deployer.deploy(RelayerManager, owner).then(function (relayerManager) {
        return deployer.deploy(GasTokenImplementation, { overwrite: false }).then(function (gasTokenImplementation) {
            return deployer.deploy(GasTokenForwarder, owner, ChiAddress, relayerManager.address, gasTokenImplementation.address);
        });
    });
};