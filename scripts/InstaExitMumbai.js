// const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {

  let usdtAddress = "0xeaBc4b91d9375796AA4F69cC764A4aB509080A58"; //goerli
  let usdcAddress = "0xdA5289fCAAF71d52a80A254da614a192b693e977"; //goerli
  let daiAddress = "0x27a44456bEDb94DbD59D0f0A14fE977c777fC5C3"; //goerli
  let owner = "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c";
  let adminFeePercentage = 300; // This is value as per 10,000 basis point, so its actual value is .3

  const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  const executorMngr = await ExecutorMngr.deploy(owner);
  await executorMngr.deployed();
  console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorMngr.address, owner, "0x2B99251eC9650e507936fa9530D11dE4d6C9C05c", adminFeePercentage);
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