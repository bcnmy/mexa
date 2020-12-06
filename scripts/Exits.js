// const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {

    // const RelayerMngr = await ethers.getContractFactory("RelayerManager");
    // const relayerMngr = await RelayerMngr.deploy();
    // await relayerMngr.deployed();
    // console.log("relayerMngr at ",relayerMngr.address);

    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy("0x812535752B160269b96250B63553B7aab7F4000d", "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c");
    await liquidityPoolMngr.deployed();
    console.log("liquidityPoolMngr at ",liquidityPoolMngr.address);

    // const deploymentData = await liquidityPoolMngr.deployTransaction.wait();
    // console.log(deploymentData);
}
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });