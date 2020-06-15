const GasTokenForwarder = artifacts.require("GasTokenForwarder");
var SafeMath = artifacts.require("SafeMath");
var RelayerManager = artifacts.require("RelayerManager");

module.exports = function(deployer) {
    
    //Owner of GasTokenForwarder Contract
    var owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";

    //GST2 address on Kovan. Replace if deploying on another address
    var GST2Address = "0x0000000000170CcC93903185bE5A2094C870Df62";

    deployer.deploy(SafeMath, { overwrite: false });
    deployer.link(SafeMath, GasTokenForwarder);
  
    // Make sure Relayer manager is not already deployed using the other script.
    deployer.deploy(RelayerManager, { overwrite: false }).then(function (relayerManager) {
        return deployer.deploy(GasTokenForwarder, owner, GST2Address, RelayerManager.address);
    });
};
