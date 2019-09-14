const IdentityProxyManager = artifacts.require("IdentityProxyManager");
module.exports = function(deployer) {
	deployer.deploy(IdentityProxyManager);
};