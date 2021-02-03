// const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {

    let usdtAddress = "0x64ef393b6846114bad71e2cb2ccc3e10736b5716" ; //goerli
    let usdcAddress = "0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF" ; //goerli
    let daiAddress = "0x2686eca13186766760a0347ee8eeb5a88710e11b" ; //goerli

    const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
    const executorMngr = await ExecutorMngr.deploy("0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c");
    await executorMngr.deployed();
    console.log("executorMngr at ",executorMngr.address);

    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address , "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c",executorMngr.address, 300);
    await liquidityPoolMngr.deployed();
    console.log("liquidityPoolMngr at ",liquidityPoolMngr.address);

    // let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager","0x48A04CBec4277d4573F11BF96Ec4584d64B45901");
    // let txUsdt = await lpProxy.setTokenTransferOverhead(usdtAddress, 26910);
    // let receipt = await txUsdt.wait(confirmations = 2);
}
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });