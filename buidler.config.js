usePlugin("@nomiclabs/buidler-waffle");
const ethers = require("ethers");

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

const infuraKey = "d126f392798444609246423b06116c77";

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

const hdWallet = (mn,index=0,num=1,path="m/44'/60'/0'/0/") => {
  let accounts = [];
  for(i=0; i<num; i++){
    accounts.push(ethers.Wallet.fromMnemonic(mn,path+i).privateKey);
  }
  return accounts;
}

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solc: {
    version: "0.6.8",
  },
  paths: {
    sources: "./contracts/6",
  },
  networks:{
    buidlerevm:{
      allowUnlimitedContractSize:false
    },
    kovan:{
      url:`https://kovan.infura.io/v3/${infuraKey}`,
      accounts:hdWallet(mnemonic),
      chainId:42,
      gas: 12500000,
      gasMultiplier:2
    },
    ropsten:{
      url:`https://ropsten.infura.io/v3/${infuraKey}`,
      accounts:hdWallet(mnemonic),
      chainId:3,
      gas: 6400000
    },
    maticTest:{
      url: `https://testnet2.matic.network`,
      accounts:hdWallet(mnemonic),
      chainId:8995,
      gas: 7000000
    },
    maticBetaMainnet: {
      url:`https://betav2.matic.network`,
      accounts:hdWallet(mnemonic),
      network_id: 16110,       // Matic's test network id
      gas: 7000000
    },
    maticTestV3: {
      url:`https://testnetv3.matic.network`,
      accounts:hdWallet(mnemonic),
      network_id: 15001
    }
  }
};
