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
    let fauAddress = "0xFab46E002BbF0b4509813474841E0716E6730136"; //goerli
    let usdcAddress = "0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF"; //goerli
    let daiAddress = "0x2686eca13186766760a0347ee8eeb5a88710e11b"; //goerli
    let nativeTokenAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; //goerli
  
    // let executorManagerAddress = "0xfA6d067626d4C9a84832d1088047563c81E9daa4";
    let owner = "0xD02329b31D6a7B33173F2197c7b04Eaf68F8184a";
    let pauser = "0xe0E67a6F478D7ED604Cf528bDE6C3f5aB034b59D";
    let trustedForwarder = "0xFD4973FeB2031D4409fB57afEE5dF2051b171104";
    let hyphenOwnerAccount = "0x65E3092D6dB27a20599dbbEc054A28a14Af32b27";
  
    let adminFeePercentage = 10; // This is value as per 10,000 basis point, so its actual value is .3%
  
    const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
    const executorMngr = await ExecutorMngr.deploy(owner);
    await executorMngr.deployed();
    executorManagerAddress = executorMngr.address;
    console.log("✅ Executor Manager deployed at : ", executorMngr.address);
  
    console.log("Sending transaction to deploy LPManager");
    const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorManagerAddress, owner, pauser, trustedForwarder, adminFeePercentage);
    await liquidityPoolMngr.deployed();
    console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);
  
    let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager", liquidityPoolMngr.address);
    let tx, receipt;
  
    tx = await lpProxy.addSupportedToken(fauAddress, "100000000000000000000","1000000000000000000000");
    receipt = await tx.wait(1);
    console.log("✅ FAU support added");
  
    tx = await lpProxy.addSupportedToken(usdcAddress, "10000000000000000","1000000000");
    receipt = await tx.wait(1);
    console.log("✅ USDC support added");
  
    tx = await lpProxy.addSupportedToken(daiAddress, "100000000000000000000","1000000000000000000000");
    receipt = await tx.wait(1);
    console.log("✅ DAI support added");
  
    tx = await lpProxy.addSupportedToken(nativeTokenAddress, "10000000000000000","1000000000000000000");
    receipt = await tx.wait(1);
    console.log("✅ Native support added");
  
    // await lpProxy.setTokenTransferOverhead(daiAddress, 40007); //40007
    // console.log("✅ DAI overhead added");
    await lpProxy.setTokenTransferOverhead(usdcAddress, 64302); //64302 - latest
    console.log("✅ USDC overhead added");
    await lpProxy.setTokenTransferOverhead(nativeTokenAddress, 61345); //61345 - latest
    console.log("✅ ETH overhead added");
    await lpProxy.setTokenTransferOverhead(fauAddress, 40850); // 40850 - latest
    console.log("✅ FAU overhead added");
    
    tx = await lpProxy.transferOwnership(hyphenOwnerAccount);
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

//     ✅ Executor Manager deployed at :  0xf2AD1A6D04AbafF760F2b60a70c877dF70C8376c
// Sending transaction to deploy LPManager
// ✅ LiquidityPool Manager deployed at :  0xf80189e8BB2C909C5802047450F24906894E5960