require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
//require('solidity-coverage');
const walletUtils = require("./walletUtils");

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

//1 foot in 1 foot out lmao
const fs = require('fs');
const infuraKey = fs.readFileSync(".infura").toString().trim();
const alchemyKey = fs.readFileSync(".alchemy").toString().trim();

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  mocha: {
    timeout: 500000
  },
  solidity: {
    compilers: [
      {
        version: "0.5.13",
        settings:{
          evmVersion: "istanbul",
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.9",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.7.6",
        settings:{
          evmVersion: "istanbul",
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.5.12",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      {
        version: "0.6.0"
      }
    ]
  },
  networks:{
    coverage: {
      url: 'http://localhost:8555'
    },
    hardhat:{
      allowUnlimitedContractSize:false,
      gas: 6000000,
      accounts:walletUtils.localWallet("1000000000000000000000000",num=20),
      forking : {
        url:`https://mainnet.infura.io/v3/${infuraKey}`
      // url:`https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`
      }
    },
    kovan:{
      url:`https://kovan.infura.io/v3/${infuraKey}`,
      // url:`https://eth-kovan.alchemyapi.io/v2/${alchemyKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:42,
      gas: 6400000,
      gasMultiplier:2
    },
    goerli:{
      url:`https://goerli.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:5,
      gas: 6400000,
      gasPrice: 20000000000
    },
    maticMumbai: {
      url:"https://rpc-mumbai.maticvigil.com/v1/2ac03d4fd9d671e79063e071828a5260d3752de3",
      accounts:walletUtils.makeKeyList(),
      chainId: 80001
    },
    matic: {
      url:"<matic_rpc_url>",
      accounts:walletUtils.makeKeyList(),
      chainId: 137,
      gasPrice: 10000000000
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infuraKey}`,
      accounts: walletUtils.makeKeyList(),
      chainId:4,
      gas: 1250000
    },
    ropsten:{
      url:`https://ropsten.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:3,
      gas: 6400000
    },
    ethMainnet:{
      url: `https://mainnet.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:1,
      gasPrice: 55000000000
    },
    binanceTest:{
      url:`https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts:walletUtils.makeKeyList(),
      chainId:97,
      gas: 6400000
    },
    avaxlocal: {
      url: 'http://localhost:9650/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43112,
      accounts: walletUtils.makeKeyList()
    },
    avaxfuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: walletUtils.makeKeyList()
    },
    avaxmainnet: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: walletUtils.makeKeyList()
    }
  }
};
