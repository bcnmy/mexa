const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {
    const MexaExchangeProxy = await ethers.getContractFactory("MexaExchangeProxy");
    const mexaExchangeProxy = await MexaExchangeProxy.deploy("0xd0a1e359811322d97991e03f863a0c30c2cf029c",{gasLimit:ethers.BigNumber.from("9500000")});
    await mexaExchangeProxy.deployed();
    console.log("MexaExchangeProxy at ",mexaExchangeProxy.address);
    const deploymentData = await mexaExchangeProxy.deployTransaction.wait();
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
  