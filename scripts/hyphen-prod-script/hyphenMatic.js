async function main() {

    let usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; 
    let usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; 
    let daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  
    let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
    let adminFeePercentage = 30; // This is value as per 10,000 basis point, so its actual value is .03
  
    const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
    const executorMngr = await ExecutorMngr.deploy(owner);
    await executorMngr.deployed();
    console.log("✅ Executor Manager deployed at : ", executorMngr.address);
  
    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address, owner,"0x29ab82ec552573b1b7d4933b2aaa3c568be9c6d1", "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8", adminFeePercentage);
    await liquidityPoolMngr.deployed();
    console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);
  
    let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager","0x707Bc4e112Ca297b513b79A3ef069F9177bC742b");
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
    console.log("✅ daiAddress support added");
    await lpProxy.setTokenTransferOverhead(usdcAddress, 46174);
    console.log("✅ usdcAddress support added");
    await lpProxy.setTokenTransferOverhead(usdtAddress, 51657);
    console.log("✅ usdtAddress support added");
    
    // tx = await lpProxy.transferOwnership("0x29ab82ec552573b1b7d4933b2aaa3c568be9c6d1");
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