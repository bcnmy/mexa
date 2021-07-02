const {expect} = require("chai");
const {ethers} = require("hardhat");
const {getSignatureParameters, makeDaiPermit, makeUsdcPermit} = require("./helpers/permitHelpers");

describe('TransferHandlerCustom', function() {
  before(async function () {
    const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    this.owner = owner;
    this.addr1 = addr1;
    this.addr2 = addr2;
    this.addr3 = addr3;
    this.addr4 = addr4;
    this.feeReceiver = addr5;
    this.daiContract = await ethers.getContractAt("Dai", "0x6b175474e89094c44da98b954eedeac495271d0f");
    this.usdcContract = await ethers.getContractAt("USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
    this.infinite = ethers.constants.MaxUint256;
    let WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
    await uniswapRouter.swapExactETHForTokens(
    0, [WETHAddress, this.daiContract.address], this.owner.address, "1000000000000000000000000", 
    {value: ethers.utils.parseEther("1000").toString()});
    await uniswapRouter.swapExactETHForTokens(
      0, [WETHAddress, this.usdcContract.address], this.owner.address, "1000000000000000000000000", 
      {value: ethers.utils.parseEther("1000").toString()});
  const TransferHandlerCustom = await ethers.getContractFactory("TransferHandlerCustom");
  this.transferHandlerCustom = await TransferHandlerCustom.deploy(this.owner.address);
  await this.transferHandlerCustom.deployed();
  })

  it("Should set fee reciever", async function() {
    await this.transferHandlerCustom.setFeeReceiver(this.feeReceiver.address);
    expect(await this.transferHandlerCustom.feeReceiver()).to.equal(this.feeReceiver.address);
  })
    
  it("Only owner should be able to fee reciever", async function() {
    await expect(this.transferHandlerCustom.connect(this.addr1.address).setFeeReceiver(this.feeReceiver.address)).to.be.revertedWith("Only contract owner is allowed to perform this operation");
  })

  it("Should set default fee multiplier", async function() {
    const multiplier = 100;
    await this.transferHandlerCustom.setDefaultFeeMultiplier(multiplier);
    expect(await this.transferHandlerCustom.feeMultiplier()).to.equal(multiplier);
  })

  it("fee multiplier should be lower than maximum markup", async function() {
    const multiplier = 26000;
    await expect(this.transferHandlerCustom.setDefaultFeeMultiplier(multiplier)).to.be.revertedWith("fee multiplier is too high");
  })

  it("Only owner should be able to fee multiplier", async function() {
    const multiplier = 100;
    await expect(this.transferHandlerCustom.connect(this.addr1.address).setDefaultFeeMultiplier(multiplier)).to.be.revertedWith("Only contract owner is allowed to perform this operation");
  })

  it("Should set transfer handler gas", async function() {
    const transferHandlerGas = 100;
    await this.transferHandlerCustom.setTransferHandlerGas(this.daiContract.address, transferHandlerGas);
    expect(await this.transferHandlerCustom.transferHandlerGas(this.daiContract.address)).to.equal(transferHandlerGas);
  })

  it("Token address for set transfer handler gas shouldn't be 0 address", async function() {
    const transferHandlerGas = 100;
    await expect(this.transferHandlerCustom.setTransferHandlerGas(ethers.constants.AddressZero, transferHandlerGas)).to.be.revertedWith("token cannot be zero");
  })

  it("Only owner should be able set transfer handler gas", async function() {
    const transferHandlerGas = 100;
    await expect(this.transferHandlerCustom.connect(this.addr1.address).setTransferHandlerGas(this.daiContract.address, transferHandlerGas)).to.be.revertedWith("Only contract owner is allowed to perform this operation");
  })

  it("Should set base gas", async function() {
    const baseGas = 25000;
    await this.transferHandlerCustom.setBaseGas(baseGas);
    expect(await this.transferHandlerCustom.baseGas()).to.equal(baseGas);
  })

  it("Only owner should be able to set base gas", async function() {
    const baseGas = 25000;
    await this.transferHandlerCustom.setBaseGas(baseGas);
    await expect(this.transferHandlerCustom.connect(this.addr1.address).setBaseGas(baseGas)).to.be.revertedWith("Only contract owner is allowed to perform this operation");
  })

  it("Only owner should be able set transfer handler gas", async function() {
    const transferHandlerGas = 100;
    await expect(this.transferHandlerCustom.connect(this.addr1.address).setTransferHandlerGas(this.daiContract.address, transferHandlerGas)).to.be.revertedWith("Only contract owner is allowed to perform this operation");
  })

  it("Should transfer USDC via permit", async function() {
    const nonce = await this.usdcContract.nonces(this.owner.address);
    const value = ethers.utils.parseUnits("1000", 6);
    const initialBalanceOwner = await this.usdcContract.balanceOf(this.owner.address);
    const initialBalanceReciever = await this.usdcContract.balanceOf(this.addr1.address);
    const {v, r, s, message} = await makeUsdcPermit(this.owner, this.transferHandlerCustom.address, nonce, value);
    const permitRequest = {
      holder: message.owner,
      spender: message.spender,
      value: message.value,
      nonce,
      expiry: message.deadline,
      allowed: true, 
      v, r, s};
    await this.transferHandlerCustom.permitEIP2612AndTransfer(0, this.usdcContract.address, this.addr1.address, value, permitRequest);
    const finalBalanceOwner = await this.usdcContract.balanceOf(this.owner.address);
    const finalBalanceReciever = await this.usdcContract.balanceOf(this.addr1.address);
    expect(initialBalanceOwner.sub(finalBalanceOwner)).to.equal(value);
    expect(finalBalanceReciever.sub(initialBalanceReciever)).to.equal(value);
  })

  it("Should fail transfer USDC via permit when expired", async function() {
    const nonce = await this.usdcContract.nonces(this.owner.address);
    const value = ethers.utils.parseUnits("1000", 6);
    const {v, r, s, message} = await makeUsdcPermit(this.owner, this.transferHandlerCustom.address, nonce, value);
    const permitRequest = {
      holder: message.owner,
      spender: message.spender,
      value: message.value,
      nonce,
      expiry: message.deadline - 100000,
      allowed: true, 
      v, r, s};
    await expect(this.transferHandlerCustom.permitEIP2612AndTransfer(0, this.usdcContract.address, this.addr1.address, value, permitRequest)).to.be.revertedWith("FiatTokenV2: permit is expired");
  })

  it("Should fail transfer USDC via permit when invalid nonce/invalid permit", async function() {
    const nonce = (await this.usdcContract.nonces(this.owner.address)) - 1;
    const value = ethers.utils.parseUnits("1000", 6);
    const {v, r, s, message} = await makeUsdcPermit(this.owner, this.transferHandlerCustom.address, nonce, value);
    const permitRequest = {
      holder: message.owner,
      spender: message.spender,
      value: message.value,
      nonce,
      expiry: message.deadline,
      allowed: true, 
      v, r, s};
    await expect(this.transferHandlerCustom.permitEIP2612AndTransfer(0, this.usdcContract.address, this.addr1.address, value, permitRequest)).to.be.revertedWith("EIP2612: invalid signature");
  })

  it("Should transfer USDC via infinite permit", async function() {
    const nonce = await this.usdcContract.nonces(this.owner.address);
    const value = ethers.utils.parseUnits("1000", 6);
    const initialBalanceOwner = await this.usdcContract.balanceOf(this.owner.address);
    const initialBalanceReciever = await this.usdcContract.balanceOf(this.addr1.address);
    const {v, r, s, message} = await makeUsdcPermit(this.owner, this.transferHandlerCustom.address, nonce, this.infinite);
    const permitRequest = {
      holder: message.owner,
      spender: message.spender,
      value: message.value,
      nonce,
      expiry: message.deadline,
      allowed: true, 
      v, r, s};
    await this.transferHandlerCustom.permitEIP2612UnlimitedAndTransfer(0, this.usdcContract.address, this.addr1.address, value, permitRequest);
    const finalBalanceOwner = await this.usdcContract.balanceOf(this.owner.address);
    const finalBalanceReciever = await this.usdcContract.balanceOf(this.addr1.address);
    const finalAllowance = await this.usdcContract.allowance(this.owner.address, this.transferHandlerCustom.address);
    expect(this.infinite.sub(finalAllowance)).to.equal(value);
    expect(initialBalanceOwner.sub(finalBalanceOwner)).to.equal(value);
    expect(finalBalanceReciever.sub(initialBalanceReciever)).to.equal(value);
  })

  it("Should fail to transfer USDC via infinite permit when expired", async function() {
    const nonce = await this.usdcContract.nonces(this.owner.address);
    const value = ethers.utils.parseUnits("1000", 6);
    const initialBalanceOwner = await this.usdcContract.balanceOf(this.owner.address);
    const initialBalanceReciever = await this.usdcContract.balanceOf(this.addr1.address);
    const {v, r, s, message} = await makeUsdcPermit(this.owner, this.transferHandlerCustom.address, nonce, this.infinite);
    const permitRequest = {
      holder: message.owner,
      spender: message.spender,
      value: message.value,
      nonce,
      expiry: message.deadline - 100000,
      allowed: true, 
      v, r, s};
    await expect(this.transferHandlerCustom.permitEIP2612UnlimitedAndTransfer(0, this.usdcContract.address, this.addr1.address, value, permitRequest)).to.be.revertedWith("FiatTokenV2: permit is expired");
  })

  it("Should fail to transfer USDC via infinite permit when invalid nonce/ invalid permit", async function() {
    const nonce = (await this.usdcContract.nonces(this.owner.address)) - 1;
    const value = ethers.utils.parseUnits("1000", 6);
    const initialBalanceOwner = await this.usdcContract.balanceOf(this.owner.address);
    const initialBalanceReciever = await this.usdcContract.balanceOf(this.addr1.address);
    const {v, r, s, message} = await makeUsdcPermit(this.owner, this.transferHandlerCustom.address, nonce, this.infinite);
    const permitRequest = {
      holder: message.owner,
      spender: message.spender,
      value: message.value,
      nonce,
      expiry: message.deadline,
      allowed: true, 
      v, r, s};
    await expect(this.transferHandlerCustom.permitEIP2612UnlimitedAndTransfer(0, this.usdcContract.address, this.addr1.address, value, permitRequest)).to.be.revertedWith("EIP2612: invalid signature");
  })

  it("Should transfer DAI via permit", async function() {
    const nonce = await this.daiContract.nonces(this.owner.address);
    const value = ethers.utils.parseUnits("1000", 6);
    const initialBalanceOwner = await this.daiContract.balanceOf(this.owner.address);
    const initialBalanceReciever = await this.daiContract.balanceOf(this.addr1.address);
    const {v, r, s, message} = await makeDaiPermit(this.owner, this.transferHandlerCustom.address, nonce);
    const permitRequest = {
      holder: message.holder,
      spender: message.spender,
      value: value,
      nonce,
      expiry: message.expiry,
      allowed: message.allowed, 
      v, r, s};
    await this.transferHandlerCustom.permitDaiAndTransfer(0, this.daiContract.address, this.addr1.address, value, permitRequest);
    const finalBalanceOwner = await this.daiContract.balanceOf(this.owner.address);
    const finalBalanceReciever = await this.daiContract.balanceOf(this.addr1.address);
    expect(initialBalanceOwner.sub(finalBalanceOwner)).to.equal(value);
    expect(finalBalanceReciever.sub(initialBalanceReciever)).to.equal(value);
  })
  it("feeReceiver should recieve the charge", async function() {
  // charge = tokenGasPrice.mul(executionGas).mul(feeMultiplier).div(10000);
    const nonce = await this.usdcContract.nonces(this.owner.address);
    const value = ethers.utils.parseUnits("1000", 6);
    const initialBalanceFeeReciever = await this.usdcContract.balanceOf(this.feeReceiver.address);
    const {v, r, s, message} = await makeUsdcPermit(this.owner, this.transferHandlerCustom.address, nonce, value);
    const permitRequest = {
      holder: message.owner,
      spender: message.spender,
      value: message.value,
      nonce,
      expiry: message.deadline,
      allowed: true, 
      v, r, s};
    await this.transferHandlerCustom.permitEIP2612AndTransfer(0, this.usdcContract.address, this.addr1.address, value, permitRequest);
    const finalBalanceFeeReciever = await this.usdcContract.balanceOf(this.feeReceiver.address);
    expect(finalBalanceFeeReciever.gte(initialBalanceFeeReciever));
  })
});