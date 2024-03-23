const { ethers } = require("hardhat");
const { deployGasTank } = require("./deploy-gastank-upgradeable");

async function main() {
  try {
    const owner = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const newOwner = "0x129443cA2a9Dec2020808a2868b38dDA457eaCC7";
    const proxyAdmin = "0x6B1c73C2b065486f5Af0097A934820a130e2DF11";
    const relayerMasterAccount = "0x9E1980070743Cb86bDbe3AE1d01018C6e97b0932";
    const trustedForwarder = "0xD240234Dacd7fFdCa7E4EffCF6C7190885D7E2f0";
    const minDeposit = ethers.utils.parseEther("0.0001");

    let config = {
      owner,
      newOwner,
      proxyAdmin,
      relayerMasterAccount,
      trustedForwarder,
      minDeposit,
      // deployedAddresses: {
      //   logicContractAddress: "0x6699cfa727ccdebef21382d20fea22a75aecc18f",
      //   proxyContractAddress: "0x48d3e8edd4cdd81e4b4eea678ab167e1988b63f2"
      // }
    };
    await deployGasTank(config);
  } catch (error) {
    console.log("❌ DEPLOYMENT FAILED ❌");
    console.log(error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
