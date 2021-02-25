// const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {

  let usdtAddress = "0x64ef393b6846114bad71e2cb2ccc3e10736b5716"; //goerli
  let usdcAddress = "0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF"; //goerli
  let daiAddress = "0x2686eca13186766760a0347ee8eeb5a88710e11b"; //goerli
  let owner = "0x256144a60f34288F7b03D345F8Cb256C502e0f2C";
  let adminFeePercentage = 300; // This is value as per 10,000 basis point, so its actual value is .3

  // const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  // const executorMngr = await ExecutorMngr.deploy(owner);
  // await executorMngr.deployed();
  // console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy("0x62d7D01072f58833B0817Ee983B3b6d2EA0d720c", owner, "0x2B99251eC9650e507936fa9530D11dE4d6C9C05c", adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);

  console.log("👏 🏁🏁 DEPLOYMENT FINISHED");

  let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager",liquidityPoolMngr.address);
  let txUsdt = await lpProxy.addSupportedToken(usdtAddress, "100000000000000000","100000000000000000000");
  let receipt = await txUsdt.wait(confirmations = 2);

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