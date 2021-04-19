const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {
    const BasicMetaTx = await ethers.getContractFactory("BasicMetaTransaction");
    const basicMetaTx = await BasicMetaTx.deploy();
    await basicMetaTx.deployed();
    console.log("ExchangeProxy at ",basicMetaTx.address);
    const deploymentData = await basicMetaTx.deployTransaction.wait();
    console.log(deploymentData);
}
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });