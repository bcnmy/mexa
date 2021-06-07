async function main() {

//   let usdtAddress = "0x64ef393b6846114bad71e2cb2ccc3e10736b5716"; //goerli
//   let usdcAddress = "0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF"; //goerli
  let daiAddress = "0x2686eca13186766760a0347ee8eeb5a88710e11b"; //goerli

  let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
  let adminFeePercentage = 30; // This is value as per 10,000 basis point, so its actual value is .3

  const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  const executorMngr = await ExecutorMngr.deploy(owner);
  await executorMngr.deployed();
  console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address, owner,"0xF82986F574803dfFd9609BE8b9c7B92f63a1410E", adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);

  let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager",liquidityPoolMngr.address);
  let tx, receipt;

//   tx = await lpProxy.addSupportedToken(usdtAddress, "100000000000000000","10000000000000000000000");
//   receipt = await tx.wait(1);
//   console.log("✅ USDT support added");

//   tx = await lpProxy.addSupportedToken(usdcAddress, "100000","10000000000");
//   receipt = await tx.wait(1);
//   console.log("✅ USDC support added");

  tx = await lpProxy.addSupportedToken(daiAddress, "100000000000000000","10000000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ DAI support added");

  await lpProxy.setTokenTransferOverhead(daiAddress, 40007); //40007
//   await lpProxy.setTokenTransferOverhead(usdcAddress, 46174); //46174
//   await lpProxy.setTokenTransferOverhead(usdtAddress, 51657); //51657
  
  // tx = await lpProxy.transferOwnership("0x256144a60f34288F7b03D345F8Cb256C502e0f2C");
  // receipt = await tx.wait(1);


  console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });