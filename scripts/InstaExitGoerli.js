async function main() {

  let usdtAddress = "0x64ef393b6846114bad71e2cb2ccc3e10736b5716"; //goerli
  let usdcAddress = "0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF"; //goerli
  let daiAddress = "0x2686eca13186766760a0347ee8eeb5a88710e11b"; //goerli
  let owner = "0x256144a60f34288F7b03D345F8Cb256C502e0f2C";
  let adminFeePercentage = 300; // This is value as per 10,000 basis point, so its actual value is .3

  const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  const executorMngr = await ExecutorMngr.deploy(owner);
  await executorMngr.deployed();
  console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address, owner, executorMngr.address, adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);

  console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
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