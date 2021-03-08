async function main() {

  let usdtAddress = "0x64ef393b6846114bad71e2cb2ccc3e10736b5716"; //goerli
  let usdcAddress = "0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF"; //goerli
  let daiAddress = "0x2686eca13186766760a0347ee8eeb5a88710e11b"; //goerli
  let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
  let adminFeePercentage = 300; // This is value as per 10,000 basis point, so its actual value is .3

  const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  const executorMngr = await ExecutorMngr.deploy(owner);
  await executorMngr.deployed();
  console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy( executorMngr.address, owner,"0x3075b4dc7085C48A14A5A39BBa68F58B19545971", adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);

  console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
  let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager",liquidityPoolMngr.address);
  await lpProxy.addSupportedToken(usdtAddress, "100000000000000000000","10000000000000000000000");
  await lpProxy.addSupportedToken(usdcAddress, "100000000","1000000000");
  await lpProxy.addSupportedToken(daiAddress, "100000000000000000000","10000000000000000000000");

  
  await lpProxy.setTokenTransferOverhead(daiAddress, 16006);
  await lpProxy.setTokenTransferOverhead(usdcAddress, 10282);
  await lpProxy.setTokenTransferOverhead(usdtAddress, 20278);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });