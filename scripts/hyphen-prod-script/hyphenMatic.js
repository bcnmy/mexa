async function main() {

    let usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; 
    let usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; 
    let daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  
    let owner = "0x6E1C86e32B8Ef79D377Af2Df721888268EC7Ce49";
    let adminFeePercentage = 10; // This is value as per 10,000 basis point, so its actual value is .01
  
    const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
    const executorMngr = await ExecutorMngr.deploy("0x29ab82ec552573b1b7d4933b2aaa3c568be9c6d1");
    await executorMngr.deployed();
    console.log("✅ Executor Manager deployed at : ", executorMngr.address);
  
    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address, owner,"0xdAC17F958D2ee523a2206206994597C13D831ec7", "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8", adminFeePercentage);
    await liquidityPoolMngr.deployed();
    console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);
  
    let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager",liquidityPoolMngr.address);
    let tx, receipt;
  
    tx = await lpProxy.addSupportedToken(usdtAddress, "100000000","5000000000");
    receipt = await tx.wait(1);
    console.log("✅ USDT support added");
  
    tx = await lpProxy.addSupportedToken(usdcAddress, "100000000","5000000000");
    receipt = await tx.wait(1);
    console.log("✅ USDC support added");
  
    tx = await lpProxy.addSupportedToken(daiAddress, "100000000000000000000","5000000000000000000000");
    receipt = await tx.wait(1);
    console.log("✅ DAI support added");
  
    await lpProxy.setTokenTransferOverhead(daiAddress, 40007);
    console.log("✅ daiAddress overhead added");
    await lpProxy.setTokenTransferOverhead(usdcAddress, 46174);
    console.log("✅ usdcAddress overhead added");
    await lpProxy.setTokenTransferOverhead(usdtAddress, 51657);
    console.log("✅ usdtAddress overhead added");
    
    tx = await lpProxy.transferOwnership("0x29ab82ec552573b1b7d4933b2aaa3c568be9c6d1");
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