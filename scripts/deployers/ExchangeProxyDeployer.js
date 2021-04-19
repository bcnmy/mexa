const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {
    const ExchangeProxy = await ethers.getContractFactory("ExchangeProxy");
    const exchangeProxy = await ExchangeProxy.deploy("0xd0a1e359811322d97991e03f863a0c30c2cf029c",{gasLimit:ethers.BigNumber.from("9500000")});
    await exchangeProxy.deployed();
    console.log("ExchangeProxy at ",exchangeProxy.address);
    const deploymentData = await exchangeProxy.deployTransaction.wait();
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
  