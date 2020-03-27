const RelayHub = artifacts.require("RelayHub");
var RelayerManager = artifacts.require("RelayerManager");
var ProxyManager = artifacts.require("ProxyManager");
var ImplementationLogic = artifacts.require("ImplementationLogic");
var SafeMath = artifacts.require("SafeMath");

module.exports = function (deployer) {
	// Initialize owner address if you want to transfer ownership of contract to some other address
	let ownerAddress = "0x7f3B192Ab3220940D66236792F3EBDB0e4E74138";

	deployer.deploy(SafeMath, { overwrite: false });
	deployer.link(SafeMath, RelayHub);


	deployer.deploy(RelayerManager, { overwrite: false }).then(function (relayerManager) {
		return deployer.deploy(ImplementationLogic).then(function (implementationLogic) {
			return deployer.deploy(ProxyManager, ImplementationLogic.address).then(function (proxyManager) {
				return deployer.deploy(RelayHub, RelayerManager.address, ProxyManager.address).then(async function (relayHub) {
					await proxyManager.upgradeRelayHub(RelayHub.address);
					if(ownerAddress && ownerAddress!="") {
						console.log(`Transfering ownerhip to address ${ownerAddress}`)
						await proxyManager.transferOwnership(ownerAddress);
						await relayHub.transferOwnership(ownerAddress);
						await relayerManager.transferOwnership(ownerAddress);
						await implementationLogic.transferOwnership(ownerAddress);
					}
				});
			});
		});
	}
	)
};