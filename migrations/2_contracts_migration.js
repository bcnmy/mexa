const IdentityProxyManager = artifacts.require("IdentityProxyManager");
const MarvelAssets = artifacts.require("MarvelAssets");
module.exports = function(deployer) {
	var relayer = "0xbfB6A7Bc0B41f54089919584ed692ac908d8cF4d";
	deployer.deploy(IdentityProxyManager, relayer);
	deployer.deploy(MarvelAssets);
};