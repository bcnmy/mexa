const IdentityProxyManager = artifacts.require("IdentityProxyManager");
const MarvelAssets = artifacts.require("MarvelAssets");

module.exports = function(deployer) {
	var relayer = "0x66323386A237EFAf78993F6F95fAf73578901D29";
	deployer.deploy(IdentityProxyManager, relayer);
	deployer.deploy(MarvelAssets);
};
