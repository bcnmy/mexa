require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
//require('solidity-coverage');
require('@eth-optimism/hardhat-ovm')
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
const blockvigilKey = fs.readFileSync(".blockvigil").toString().trim();

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
        version: "0.6.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      {
        version: "0.6.0"
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      }
    ]
  },
  networks:{
    coverage: {
      url: 'http://localhost:8555'
    },
    hardhat:{
      allowUnlimitedContractSize:false,
      gas: "auto",
      accounts:walletUtils.localWallet("1000000000000000000000000",num=20),
      forking : {
        //url:`https://mainnet.infura.io/v3/${infuraKey}`
        url:`https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`
      }
    },
    kovan:{
      //url:`https://kovan.infura.io/v3/${infuraKey}`,
      url:`https://eth-kovan.alchemyapi.io/v2/${alchemyKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:42,
      gas: 1250000,
      gasMultiplier:2
    },
    goerli:{
      url:`https://goerli.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:5,
      gas: 6400000
    },
    mainnet:{
      url:`https://mainnet.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:1,
      gas: "auto"
    },
    maticMumbai: {
      url:"https://rpc-mumbai.maticvigil.com",
      accounts:walletUtils.makeKeyList(),
      chainId: 80001
    },
    moonbeamTest: {
      url:"https://rpc.testnet.moonbeam.network",
      accounts:walletUtils.makeKeyList(),
      chainId: 1287
    },
    arbitrumTest: {
      url:"https://kovan4.arbitrum.io/rpc",
      accounts:walletUtils.makeKeyList(),
      chainId: 212984383488152
    },
    optimisticTest: {
      url:"https://kovan.optimism.io",
      accounts:walletUtils.makeKeyList(),
      gasPrice: 15000000, //required
      ovm: true, // required
      chainId: 69
    },
    maticMainnet: {
      url:`https://rpc-mainnet.maticvigil.com/v1/${blockvigilKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId: 137
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infuraKey}`,
      accounts: walletUtils.makeKeyList(),
      chainId:4,
      gas: 1250000,
      gasMultiplier:2
    },
    ropsten:{
      url:`https://ropsten.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:3,
      gas: 6400000
    },
    goerli:{
      url:`https://goerli.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:5,
      gas: 6400000
    },
    binanceTest:{
      url:`https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts:walletUtils.makeKeyList(),
      chainId:97,
      gas: 6400000
    },
    binance:{
      url:`https://bsc-dataseed.binance.org/`,
      accounts:walletUtils.makeKeyList(),
      chainId:56,
      gas: "auto"
    }

  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "B2GZS7B1U65IQHHSYU3KX7PSXQRXA59EYP"
  }
};
