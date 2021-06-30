async function main() {

    let usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    let usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    let daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
  
    let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
    let adminFeePercentage = 30; // This is value as per 10,000 basis point, so its actual value is .03
  
    const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
    const executorMngr = await ExecutorMngr.deploy(owner);
    await executorMngr.deployed();
    console.log("✅ Executor Manager deployed at : ", executorMngr.address);
  
    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address, owner,"0x29ab82ec552573b1b7d4933b2aaa3c568be9c6d1","0x84a0856b038eaAd1cC7E297cF34A7e72685A8693", adminFeePercentage);
    await liquidityPoolMngr.deployed();
    console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);
  
    let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager",liquidityPoolMngr.address);
    let tx, receipt;
  
    tx = await lpProxy.addSupportedToken(usdtAddress, "200000000000000000000","1000000000000000000000");
    receipt = await tx.wait(1);
    console.log("✅ USDT support added");
  
    tx = await lpProxy.addSupportedToken(usdcAddress, "200000000","1000000000");
    receipt = await tx.wait(1);
    console.log("✅ USDC support added");
  
    tx = await lpProxy.addSupportedToken(daiAddress, "200000000000000000000","1000000000000000000000");
    receipt = await tx.wait(1);
    console.log("✅ DAI support added");
  
    await lpProxy.setTokenTransferOverhead(daiAddress, 40007);
    console.log("✅ DAI overhead added");
    await lpProxy.setTokenTransferOverhead(usdcAddress, 46174);
    console.log("✅ USDC overhead added");
    await lpProxy.setTokenTransferOverhead(usdtAddress, 51657);
    console.log("✅ USDT overhead added");
    
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