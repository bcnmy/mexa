// const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {

    const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
    const executorMngr = await ExecutorMngr.deploy("0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c");
    await executorMngr.deployed();
    console.log("executorMngr at ",executorMngr.address);

    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address , "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c", 3);
    await liquidityPoolMngr.deployed();
    console.log("liquidityPoolMngr at ",liquidityPoolMngr.address);
}
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });