# Mexa
Mexa is Biconomy's implementation of meta transactions.
This repository contains smart contracts for mexa and allow dapp users to perform blockchain operations without holding any ether or other crypto currency.

THIS BRANCH OF MEXA HAS BEEN ADAPTED TO SUPPORT BUIDLER INSTEAD OF TRUFFLE

<h3>Pre-Requisite</h3>

In Order to deploy the contracts to networks other than local blockchain, you need to add file with name <code>.secret</code> to the root folder and add the 12 word mnemonic phrase corresponding to your account which will be used to deploy the contracts to selected network.

DEPLOYMENT SUPPORT NOT INTEGRATED YET

<h3>Smart Contracts</h3>
<h4><a href="https://github.com/bcnmy/mexa/blob/master/contracts/RelayHub.sol" target="_blank">Relay Hub</a></h4>
Relay hub smart contract is the main contract which interacts with biconomy relayers. All operations including adding relayers, creating a new contract wallet for user or relaying a meta transcation goes through Relay Hub contract.
RelayHub do not have any storage. <br/>It is the first point of contact from external systems.<br/>
RelayHub's forward function is used to relay all meta transaction after signature verification.

<h4><a href="https://github.com/bcnmy/mexa/blob/master/contracts/ProxyManager.sol" target="_blank">Proxy Manager</a></h4>
Proxy Manager stores the mapping of EOA(Externally Owned Account) to user smart contract wallet address.

<h4><a href="https://github.com/bcnmy/mexa/blob/master/contracts/RelayerManager.sol" target="_blank">Relayer Manager</a></h4>
Relayer Manager stores the relayers that are allowed to relay meta transactions via Relay Hub contract.

<h4><a href="https://github.com/bcnmy/mexa/blob/master/contracts/IdentityProxy.sol" target="_blank">Identity Proxy</a></h4>
This is an upgradable smart contract wallet that is created for the User and user's EOA address is set as the owner of smart contract wallet.

<h3>To compile contracts</h3>
  <code>npx buidler compile --config buidler.config.5.js && npx buidler compile</code>

<h3>To deploy contracts to network</h3>
  <code>WORK IN PROGRESS</code>
  
<br/><br/>
For more information, join our discord channel https://discord.gg/C4XtWtB 
