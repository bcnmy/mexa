const ethers = require("ethers");

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

const makeKeyList = (num=1,mn=mnemonic,index=0,path="m/44'/60'/0'/0/") => {
  let accounts = [];
  for(i=0; i<num; i++){
    accounts.push(ethers.Wallet.fromMnemonic(mn,path+i).privateKey);
  }
  return accounts;
}

const makeSignerList = (num=1,mn=mnemonic,index=0,path="m/44'/60'/0'/0/") => {
  let accounts = [];
  for(i=0; i<num; i++){
    accounts.push(ethers.Wallet.fromMnemonic(mn,path+i));
  }
  return accounts;
}

const localWallet = (b,num=1,mn=mnemonic,index=0,path="m/44'/60'/0'/0/") =>{
  let hdW = makeKeyList(num,mn,index,path);
  let lW = [];
  for(i=0; i<hdW.length; i++){
    lW.push({privateKey:hdW[i],balance:b});
  }
  return lW;
}

const ganacheWallet = (b,num=1,mn=mnemonic,index=0,path="m/44'/60'/0'/0/") =>{
  let hdW = makeKeyList(num,mn,index,path);
  let lW = [];
  for(i=0; i<hdW.length; i++){
    lW.push({secretKey:hdW[i],balance:b});
  }
  return lW;
};

let walletUtils = () => {};
walletUtils.makeKeyList = makeKeyList;
walletUtils.makeSignerList = makeSignerList;
walletUtils.localWallet = localWallet;
walletUtils.ganacheWallet = ganacheWallet;

module.exports = walletUtils;