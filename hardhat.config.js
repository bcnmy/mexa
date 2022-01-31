require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
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
const etherscanKey = fs.readFileSync(".etherscan").toString().trim();
const alchemyKey = fs.readFileSync(".alchemy").toString().trim();
const blockvigilKey = fs.readFileSync(".blockvigil").toString().trim();
const palmInfuraKey = fs.readFileSync(".palminfura").toString().trim();

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  ovm: {
    solcVersion: '0.7.6' // Your version goes here.
  },
  mocha: {
    timeout: 500000
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings:{
          evmVersion: "berlin",
          optimizer: { enabled: true, runs: 200 }
        }
      },
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
    gnosisChainMain: {
      url:`https://rpc.gnosischain.com/`,
      accounts:walletUtils.makeKeyList(),
      chainId:100,
    },
    mainnet:{
      url:`https://mainnet.infura.io/v3/${infuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:1,
      gas: "auto"
    },
    maticMumbai: {
      url:"https://rpc-mumbai.matic.today",
      accounts:walletUtils.makeKeyList(),
      chainId: 80001
    },
    moonbeamTest: {
      url:"https://rpc.testnet.moonbeam.network",
      accounts:walletUtils.makeKeyList(),
      chainId: 1287
    },
    moonbeamMainnet: {
      url:"https://moonbeam.api.onfinality.io/public",
      accounts:walletUtils.makeKeyList(),
      chainId: 1284
    },
    arbitrumTest: {
      //use rinkeby v5
      url:"https://kovan4.arbitrum.io/rpc",
      accounts:walletUtils.makeKeyList(),
      chainId: 212984383488152
    },
    arbitrumMain: {
      url:"https://arb1.arbitrum.io/rpc/",
      accounts:walletUtils.makeKeyList(),
      chainId: 42161
    },
    avalancheTest: {
      url:"https://api.avax-test.network/ext/bc/C/rpc",
      accounts:walletUtils.makeKeyList(),
      chainId: 43113
    },
    avalancheMain: {
      url:"https://api.avax.network/ext/bc/C/rpc",
      accounts:walletUtils.makeKeyList(),
      chainId: 43114
    },
    palmTestnet: {
      url:`https://palm-testnet.infura.io/v3/${palmInfuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId: 11297108099
    },
    palmMainnet: {
      url:`https://palm-mainnet.infura.io/v3/${palmInfuraKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId: 11297108109
    },
    fantomTestnet: {
      url:`https://rpc.testnet.fantom.network`,
      accounts:walletUtils.makeKeyList(),
      chainId: 4002
    },
    fantomMainnet: {
      url:`https://rpc.testnet.fantom.network`,
      accounts:walletUtils.makeKeyList(),
      chainId: 250
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
    apiKey: etherscanKey
  }
};
