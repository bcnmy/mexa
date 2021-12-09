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
  let usdtAddress = "0xc7198437980c041c805a1edcba50c1ce5db95118";
  let usdcAddress = "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664";
   let ethAddress = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";

  let owner = "0xF9bc6309FAe18d29bF2Ba0FA46aFDa9A8bb5B37c";
  let hyphenOwnerAccount = "0x29ab82ec552573b1b7d4933b2aaa3c568be9c6d1";
  let pauser = "0x129443cA2a9Dec2020808a2868b38dDA457eaCC7";
  let trustedForwarder = "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8";
  let adminFeePercentage = 10; // This is value as per 10,000 basis point, so its actual value is .1

  const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  const executorMngr = await ExecutorMngr.deploy(owner);
  await executorMngr.deployed();
  executorManagerAddress = executorMngr.address;
  console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorManagerAddress, owner, pauser, trustedForwarder, adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);

  let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager", liquidityPoolMngr.address);
  // let tx, receipt;

  tx = await lpProxy.addSupportedToken(usdtAddress, "100000000", "50000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDT support added");

  tx = await lpProxy.addSupportedToken(usdcAddress, "100000000", "50000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDC support added");

  // tx = await lpProxy.addSupportedToken(daiAddress, "200000000000000000000", "1000000000000000000000");
  // receipt = await tx.wait(1);
  // console.log("✅ DAI support added");

  tx = await lpProxy.addSupportedToken(ethAddress, "20000000000000000", "15000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ ETH support added");

  // await lpProxy.setTokenTransferOverhead(daiAddress, 40007);
  // console.log("✅ daiAddress support added");
  await lpProxy.setTokenTransferOverhead(usdcAddress, 53083);
  console.log("✅ usdcAddress overhaead added");
  await lpProxy.setTokenTransferOverhead(usdtAddress, 61373);
  console.log("✅ usdtAddress overhaead added");
  await lpProxy.setTokenTransferOverhead(ethAddress, 40789);
  console.log("✅ ethAddress overhaead added");

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