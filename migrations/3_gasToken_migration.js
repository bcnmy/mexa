const GasTokenForwarder = artifacts.require("GasTokenForwarder");
var SafeMath = artifacts.require("SafeMath");


module.exports = function(deployer) {
    
    var owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
    var GST2Address = "0x0000000000170CcC93903185bE5A2094C870Df62";

    deployer.deploy(SafeMath, { overwrite: false });
    deployer.link(SafeMath, GasTokenForwarder);
  
    deployer.deploy(GasTokenForwarder, owner, GST2Address);
};
