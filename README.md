# Mexa By Biconomy

Mexa is Biconomy's implementation of meta transactions. 

This repo contains the stuff that makes Biconomy tick, plus some cool resources that dApps can use to integrate meta transactions into their contracts.

<h2>🤩 Cool Contracts for dApps</h2>
<h3><a href="https://github.com/bcnmy/mexa/blob/master/contracts/5/BasicMetaTransaction.sol">BasicMetaTransaction</a></h3>
Inherit this in your contract and replace msg.sender with msgSender() and you're good to go! 💪 This implementation is designed to work with eth_sign instead of EIP712 - due to it's wider support.

<h2>👨‍💻 Working On Mexa</h2>
<h3>Providing Seed Phrase</h3>
To keep testing and deployment consistent, we use a seed phrase to generate the accounts we use - when testing and deploying contracts. You need to add file with name <code>.secret</code> to the root folder and add the 12 word mnemonic phrase corresponding to your account which will be used to deploy the contracts.

 <h3>👷 Compiling Contracts</h3>

<code>npx buidler compile --config buidler.config.5.js && npx buidler compile</code>

<h3>✔️ Running Tests </h3>
Run Unit Tests : 
<code>npx buidler test</code><br>

Run Unit Tests with Code Coverage (this is currently broken due to issues involving Ganache 😢): <code>npx buidler coverage --network coverage</code><br>

<h3>📡 Deploying Contracts</h3>

WORK IN PROGRESS - FOR NOW MUST BUILD SCRIPT FOR EACH DEPLOYMENT, see scripts/sample-script.js for info on how to do this

<h2>👋 How to Reach Out to Us </h2>

For more information, join our discord channel https://discord.gg/C4XtWtB
