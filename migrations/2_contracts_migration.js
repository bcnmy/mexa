const IdentityProxyManager = artifacts.require("IdentityProxyManager");
var RelayerManager = artifacts.require("RelayerManager");
module.exports = function(deployer) {
	deployer.deploy(RelayerManager,{overwrite: false}).then(function() {
		return deployer.deploy(IdentityProxyManager,RelayerManager.address);
	});
};