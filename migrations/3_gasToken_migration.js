const GasTokenForwarder = artifacts.require("GasTokenForwarder");
const GasTokenImplementationLogic = artifacts.require("GasTokenImplementationLogic");
var RelayerManager = artifacts.require("RelayerManager");
var SafeMath = artifacts.require("SafeMath");

module.exports = function(deployer) {
    // Owner of GasTokenForwarder Contract
    var owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";

    //Chi token address on Kovan. Replace if deploying on another address
    var ChiAddress = "0x9994B6C8Dd136157235941A35545Cf6f7eB279c0";

    deployer.deploy(SafeMath, { overwrite: false });
    deployer.link(SafeMath, GasTokenImplementationLogic);
    deployer.link(SafeMath, GasTokenForwarder);

    // Make sure Relayer manager is not already deployed using the other script.
    deployer.deploy(RelayerManager, { overwrite: false }).then(function (relayerManager) {
        return deployer.deploy(GasTokenImplementationLogic, { overwrite: false }).then(function (gasTokenImplementationLogic) {
            return deployer.deploy(GasTokenForwarder, owner, ChiAddress, relayerManager.address, gasTokenImplementationLogic.address);
        });
    });
};