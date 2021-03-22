const fs = require('fs');
const axios = require("axios");
const etherscanApiKey = fs.readFileSync(".etherscan").toString().trim();
const etherscanApi = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanApiKey}`;
const maticGasStationApi = 'https://gasstation-mainnet.matic.network';

function estimateGasPrice () {
  if (etherscanApi) {
    let url = etherscanApi.split("?");
    url = url[0];
    console.log(`Getting gas price from ether scan for Ethereum Mainnet using URL ${url}`);
  }

  return new Promise((resolve, reject) => {
    axios
      .get(etherscanApi)
      .then(function (response) {
        if (response.data && response.data.status) {
          const mediumGasPrice = response.data.result.SafeGasPrice;
          const mediumGasPriceInWei = mediumGasPrice * 1e9; // gasPrice is in 1 Gwei unit3
          console.log(`Medium GasPrice for Mainnet from etherscan api is ${mediumGasPriceInWei} wei`);

          const fastGasPrice = response.data.result.ProposeGasPrice;
          const fastGasPriceInWei = fastGasPrice * 1e9; // gasPrice is in 1 Gwei unit
          console.log(`Fast GasPrice for Mainnet from etherscan api is ${fastGasPriceInWei} wei`);
          resolve({ mediumGasPriceInWei, fastGasPriceInWei });
        } else {
          console.log(`Etherscan api reponse status ${response.status} and response data ${response.data}`);
          reject(new Error("There is some problem in fetching gasPrice from etherscan"));
        }
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

function estimateGasPriceMatic () {
  if (etherscanApi) {
    let url = maticGasStationApi.split("?");
    url = url[0];
    console.log(`Getting gas price from Matic gas station for Matic Mainnet using URL ${url}`);
  }

  return new Promise((resolve, reject) => {
    axios
      .get(maticGasStationApi)
      .then(function (response) {
        if (response && response.data) {
          console.log(response.data);
          const mediumGasPrice = response.data.standard;
          const mediumGasPriceInWei = mediumGasPrice * 1e9; // gasPrice is in 1 Gwei unit
          console.log(`Medium GasPrice for Mainnet from Matic gas station api is ${mediumGasPriceInWei} wei`);

          const fastGasPrice = response.data.fast;
          const fastGasPriceInWei = fastGasPrice * 1e9; // gasPrice is in 1 Gwei unit
          console.log(`Fast GasPrice for Mainnet from Matic gas station api is ${fastGasPriceInWei} wei`);
          resolve({ mediumGasPriceInWei, fastGasPriceInWei });
        } else {
          console.log(`Etherscan api reponse status ${response.status} and response data ${response.data}`);
          reject(new Error("There is some problem in fetching gasPrice from etherscan"));
        }
      })
      .catch(function (error) {
        reject(error);
      });
  });
};


module.exports = { estimateGasPrice, estimateGasPriceMatic };
