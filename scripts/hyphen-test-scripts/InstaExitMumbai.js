async function main() {

  let usdtAddress = "0xeaBc4b91d9375796AA4F69cC764A4aB509080A58"; //mumbai
  let usdcAddress = "0xdA5289fCAAF71d52a80A254da614a192b693e977"; //mumbai
  let daiAddress = "0x27a44456bEDb94DbD59D0f0A14fE977c777fC5C3"; //mumbai

  let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
  let adminFeePercentage = 30; // This is value as per 10,000 basis point, so its actual value is .3

  // const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  // const executorMngr = await ExecutorMngr.deploy(owner);
  // await executorMngr.deployed();
  // console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  console.log("Sending transaction to deploy LPManager");
  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy("0x62d7D01072f58833B0817Ee983B3b6d2EA0d720c", owner, owner, "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b", adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);

  let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager",liquidityPoolMngr.address);

  let tx, receipt;
  
  tx = await lpProxy.addSupportedToken(usdtAddress, "300000000000000000000","1000000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDT support added");

  tx = await lpProxy.addSupportedToken(usdcAddress, "300000000","1000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDC support added");

  tx = await lpProxy.addSupportedToken(daiAddress, "300000000000000000000","10000000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ DAI support added");

  await lpProxy.setTokenTransferOverhead(daiAddress, 40007); //40007
  console.log("✅ DAI overhead added");
  await lpProxy.setTokenTransferOverhead(usdcAddress, 46174); //46174
  console.log("✅ USDC overhead added");
  await lpProxy.setTokenTransferOverhead(usdtAddress, 51657); //51657
  console.log("✅ USDT overhead added");

  tx = await lpProxy.transferOwnership("0x65E3092D6dB27a20599dbbEc054A28a14Af32b27");
  receipt = await tx.wait(1);
  console.log("✅ Ownership transferred");

  
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