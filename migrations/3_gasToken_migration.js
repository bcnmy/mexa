const GasTokenForwarder = artifacts.require("GasTokenForwarder");
const GasTokenImplementation = artifacts.require("GasTokenImplementation");
var RelayerManager = artifacts.require("RelayerManager");
var SafeMath = artifacts.require("SafeMath");

module.exports = function(deployer) {
    // Owner of GasTokenForwarder Contract
    var owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";

    //Chi token address on mainnet. Replace if deploying on another address
    // var ChiAddress = "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c";

    //Chi token address on Kovan. Replace if deploying on another address
    var ChiAddress = "0x0000000000004946c0e9f43f4dee607b0ef1fa1c";

    deployer.deploy(SafeMath, { overwrite: false });
    deployer.link(SafeMath, GasTokenImplementation);
    deployer.link(SafeMath, GasTokenForwarder);

    // Make sure Relayer manager is not already deployed using the other script.
    deployer.deploy(RelayerManager, { overwrite: false }).then(function (relayerManager) {
        return deployer.deploy(GasTokenImplementation, { overwrite: false }).then(function (gasTokenImplementation) {
            return deployer.deploy(GasTokenForwarder, owner, ChiAddress, relayerManager.address, gasTokenImplementation.address);
        });
    });
};