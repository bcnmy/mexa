const RelayHub = artifacts.require("RelayHub");
var RelayerManager = artifacts.require("RelayerManager");
var ProxyManager = artifacts.require("ProxyManager");
var ImplementationLogic = artifacts.require("ImplementationLogic");
var SafeMath = artifacts.require("SafeMath");

module.exports = function (deployer) {
	deployer.deploy(SafeMath, { overwrite: false });
	deployer.link(SafeMath, RelayHub);


	deployer.deploy(RelayerManager, { overwrite: false }).then(function (relayerManager) {
		return deployer.deploy(ImplementationLogic).then(function (implementationLogic) {
			return deployer.deploy(ProxyManager, ImplementationLogic.address).then(function (proxyManager) {
				return deployer.deploy(RelayHub, RelayerManager.address, ProxyManager.address).then(async function (relayHub) {
					await proxyManager.upgradeRelayHub(RelayHub.address);
				});
			});
		});
	}
	)
};