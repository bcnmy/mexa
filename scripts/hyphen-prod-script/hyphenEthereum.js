async function main() {

   /**
    * Follow the steps to deploy contracts on local machine
    * If you are deploying for the first time
    * 1. Uncomment below lines involving ExecutorMngr deployment
    * 2. Set executorManagerAddress value to the deployed ExecutorMngr address
    * 
    * If you are updating already deployed LiquidityPoolManager Contract
    * 1. Set executorManagerAddress with your ExecutorManager Address
    * 2. Set the owner variable with the address represented by the mnemonic present in .secret file
    * 3. Set the hyphenOwnerAccount variable with the owner address set in hyphen config .env file
    */
    let usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    let usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    let daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    let nativeTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  
    let executorManagerAddress = "0xEeD0c0AA1d73Ed0F48559e6CC2C762D4Ed5ca1Ca";
    let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
    let hyphenOwnerAccount = "0x29ab82ec552573b1b7d4933b2aaa3c568be9c6d1";
    let pauser = "0x129443cA2a9Dec2020808a2868b38dDA457eaCC7";
    let trustedForwarder = "0x84a0856b038eaAd1cC7E297cF34A7e72685A8693";
    let adminFeePercentage = 10; // This is value as per 10,000 basis point, so its actual value is .1
  
    // const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
    // const executorMngr = await ExecutorMngr.deploy(owner);
    // await executorMngr.deployed();
    // executorManagerAddress = executorMngr.address;
    // console.log("✅ Executor Manager deployed at : ", executorMngr.address);  
  
    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorManagerAddress, owner, pauser, trustedForwarder, adminFeePercentage);
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
  
    // tx = await lpProxy.addSupportedToken(daiAddress, "200000000000000000000","1000000000000000000000");
    // receipt = await tx.wait(1);
    // console.log("✅ DAI support added");

    tx = await lpProxy.addSupportedToken(nativeTokenAddress, "10000000000000000","15000000000000000000");
    receipt = await tx.wait(1);
    console.log("✅ Native support added");
  
    // await lpProxy.setTokenTransferOverhead(daiAddress, 40007);
    // console.log("✅ DAI overhead added");
    await lpProxy.setTokenTransferOverhead(usdcAddress, 53083);//53083
    console.log("✅ USDC overhead added");
    await lpProxy.setTokenTransferOverhead(usdtAddress, 61373); // 61373
    console.log("✅ USDT overhead added");
    await lpProxy.setTokenTransferOverhead(nativeTokenAddress, 40789); // 40789
    console.log("✅ Native overhead added");
    
    tx = await lpProxy.transferOwnership(hyphenOwnerAccount);
    receipt = await tx.wait(1);
  
  
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