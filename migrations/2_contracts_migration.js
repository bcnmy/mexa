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
					await relayerManager.addRelayers(['0xBA0de9A00FBC576080F830ee1CBdb9e5C1839818', '0x03E48F718d5aB07Da5fd4f510c6CE85299d14A71', '0x0Dd68dFf76277D699a57e116658330ABF643836A', '0x886d8Ea260DDbE52c077272F3970151ad3075c1a', '0x4Ef2e9B579B069d3aDf4993733bEE281EBE2A659', '0x8B91211f29d62FD2956c6780541f813bBaff4287', '0xade6AC028521BAd0a0E841216A7e1905c83D07Be', '0xD8E07cAc69eCf3E8D1b6d2d4895292C3cB4A5F38', '0x825617b3e757e8C941Cec9233F9c374B36D87265', '0x7a4a52a3607aC55892d0a165ABa7A4872c134f23', '0x01DFb52B865684aeb5E310eED32578893462aEf7']);
					await proxyManager.upgradeRelayHub(RelayHub.address);
				});
			});
		});
	};