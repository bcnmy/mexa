# Mexa By Biconomy

Mexa is Biconomy's implementation of meta transactions. 

This repo contains the stuff that makes Biconomy tick, plus some cool resources that dApps can use to integrate meta transactions into their contracts.

<h2>🤩 Cool Contracts for Gasless Meta Transactions</h2>

<h3>Custom Meta Transactions</h3>

<h4><a href="https://github.com/bcnmy/mexa/blob/master/contracts/5/BasicMetaTransaction.sol">BasicMetaTransaction</a></h4>
Inherit this in your contract and replace msg.sender with msgSender() and you're good to go! 💪 This implementation is designed to work with eth_sign instead of EIP712 - due to it's wider support.

<h4><a href="https://github.com/bcnmy/mexa/blob/master/contracts/5/EIP712MetaTransaction.sol">EIP712MetaTransaction</a></h4>
Inherit this in your contract and replace msg.sender with msgSender() and you're good to go! 💪 This implementation is designed to work with EIP712 signatures for providing a better messaging to the end users while getting their signatures.


<h3><a href="https://eips.ethereum.org/EIPS/eip-2771" target="_blank">EIP-2771</a> Secure Native Meta Transactions</h3>
With adherence to EIP-2771 to enable native meta transactions in your contract, you can just inherit a simple contract <a href="https://github.com/opengsn/forwarder/blob/master/contracts/BaseRelayRecipient.sol" target="_blank">BaseRelayRecipient.sol</a> and set the trusted forwarder address.

The Trusted Forwarder is responsible for signature verification and replay protection and forwards the transaction to your smart contract by appending the user address at the end of calldata. The _msgSender() method in your smart contract (inherited by BaseRelayRecipient) does the rest by returning the correct address for any context. Use _msgSender() wherever you use msg.sender.

<h3>FORWARD --> Save your ETH. Pay gas in ERC20 tokens</h3>
Using Biconomy Forward module, you can let your users pay the gas fee in ERC20 tokens and let your users save ETH and providing a seamless transaction experience.
<br/>

Forward contracts can be found <a href="https://github.com/bcnmy/mexa/tree/master/contracts/6/forwarder">here</a>

Refer our <a href="https://docs.biconomy.io" target="_blank">official documentation</a> for more information on how to use Biconomy to start providing a seamless experience to your users.

<h2>👨‍💻 Working On Mexa</h2>
<h3>Providing Seed Phrase</h3>
To keep testing and deployment consistent, we use a seed phrase to generate the accounts we use - when testing and deploying contracts. You need to add file with name <code>.secret</code> to the root folder and add the 12 word mnemonic phrase corresponding to your account which will be used to deploy the contracts.

<h3>Providing API Keys</h3>
Both an <a href="https://www.alchemyapi.io/" target="_blank">Alchemy</a> and an <a href="https://infura.io/" target="_blank">Infura</a> API key will be needed to compile and test the contracts.

<code>
 # create necessary files
 touch .infura .alchemy
 # add keys to file
</code>

<h3>👷 Compiling Contracts</h3>

<code>npx hardhat compile</code>

<h3>✔️ Running Tests </h3>

Run Unit Tests : 
<code>npx hardhat test</code><br>

<h3>✔️ Running Test Coverage </h3>
 <code>npx hardhat coverage --solcoverjs ./.solcover.js</code><br/>
 
Note: Some tests are skipped while running coverage as per hardhat <a href="https://hardhat.org/plugins/solidity-coverage.html">documentation </a>

<h3>📡 Deploying Contracts</h3>

See <a href="https://hardhat.org/plugins/hardhat-deploy.html"> Hardhat Deploy </a>

<h2>👋 How to Reach Out to Us</h2>

Join our discord channel https://discord.gg/C4XtWtB
