// const bre = require("@nomiclabs/buidler");

//{gasLimit:"4000000"}

async function main() {

  let usdtAddress = "0xeaBc4b91d9375796AA4F69cC764A4aB509080A58"; //goerli
  let usdcAddress = "0xdA5289fCAAF71d52a80A254da614a192b693e977"; //goerli
  let daiAddress = "0x27a44456bEDb94DbD59D0f0A14fE977c777fC5C3"; //goerli

  let owner = "0xEbdC114433f8119c1367e23A90CBbC7E2D11efBf";
  let adminFeePercentage = 300; // This is value as per 10,000 basis point, so its actual value is .3

  // const ExecutorMngr = await ethers.getContractFactory("ExecutorManager");
  // const executorMngr = await ExecutorMngr.deploy(owner);
  // await executorMngr.deployed();
  // console.log("✅ Executor Manager deployed at : ", executorMngr.address);

  const LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
  const liquidityPoolMngr = await LiquidityPoolMngr.deploy("0xF7a71D6Dd926D922cFB21a0815cBAce30474f805", owner, "0x2B99251eC9650e507936fa9530D11dE4d6C9C05c", adminFeePercentage);
  await liquidityPoolMngr.deployed();
  console.log("✅ LiquidityPool Manager deployed at : ", liquidityPoolMngr.address);

  let lpProxy = await hre.ethers.getContractAt("contracts/6/insta-swaps/LiquidityPoolManager.sol:LiquidityPoolManager",liquidityPoolMngr.address);
  let txUsdt = await lpProxy.addSupportedToken(usdtAddress, "100000000000000000","100000000000000000000");
  let tx, receipt;
  
  tx = await lpProxy.addSupportedToken(usdtAddress, "100000000000000000","10000000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDT support added");

  tx = await lpProxy.addSupportedToken(usdcAddress, "1000000","10000000000");
  receipt = await tx.wait(1);
  console.log("✅ USDC support added");

  tx = await lpProxy.addSupportedToken(daiAddress, "100000000000000000","10000000000000000000000");
  receipt = await tx.wait(1);
  console.log("✅ DAI support added");

  tx = await lpProxy.transferOwnership("0x256144a60f34288F7b03D345F8Cb256C502e0f2C");
  receipt = await tx.wait(1);
  
  console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
  // let txUsdt = await lpProxy.setTokenTransferOverhead(usdtAddress, 26910);
  // let receipt = await txUsdt.wait(confirmations = 2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });