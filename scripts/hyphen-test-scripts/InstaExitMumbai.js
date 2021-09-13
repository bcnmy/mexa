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

  let usdtAddress = "0xeaBc4b91d9375796AA4F69cC764A4aB509080A58"; //mumbai
  let usdcAddress = "0xdA5289fCAAF71d52a80A254da614a192b693e977"; //mumbai
  let daiAddress = "0x27a44456bEDb94DbD59D0f0A14fE977c777fC5C3"; //mumbai
  let ethAddress = "0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa"; //mumbai
  
  let executorManagerAddress = "0x62d7D01072f58833B0817Ee983B3b6d2EA0d720c";
  let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
  let pauser = "0xD66a690aD1BA31989f4D8F4E0CC588b9cDeB0975";
  let trustedForwarder = "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b";
  let hyphenOwnerAccount = "0x256144a60f34288F7b03D345F8Cb256C502e0f2C";
  let adminFeePercentage = 10; // This is value as per 10,000 basis point, so its actual value is .1

  // const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  // const executorMngr = await ExecutorMngr.deploy(owner);
  // await executorMngr.deployed();
  // executorManagerAddress = executorMngr.address;
  // console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  console.log("Sending transaction to deploy LPManager");
  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorManagerAddress, owner, pauser, trustedForwarder, adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);


  let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager", "0xC6661f9b1B1c413639a78075ba743cFA26F8c985");

  let tx, receipt;
  
  tx = await lpProxy.addSupportedToken(usdtAddress, "100000000000000000000","1000000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDT support added");

  tx = await lpProxy.addSupportedToken(usdcAddress, "100000000","1000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDC support added");

  tx = await lpProxy.addSupportedToken(daiAddress, "100000000000000000000","1000000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ DAI support added");

  tx = await lpProxy.addSupportedToken(ethAddress, "10000000000000000","1000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ ETH support added");

  // await lpProxy.setTokenTransferOverhead(daiAddress, 40007); //40007
  // console.log("✅ DAI overhead added");
  await lpProxy.setTokenTransferOverhead(usdcAddress, 53083); //53083
  console.log("✅ USDC overhead added");
  await lpProxy.setTokenTransferOverhead(usdtAddress, 61373); //61373
  console.log("✅ USDT overhead added");
  await lpProxy.setTokenTransferOverhead(ethAddress, 40789); //40789
  console.log("✅ WETH overhead added");

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