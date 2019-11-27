pragma solidity ^0.5.0;
import "./libs/Ownable.sol";

contract RelayerManager is Ownable(msg.sender){
    address[] public relayers;
	mapping(address => bool) public relayerStatus;

    event RelayerAdded(address relayer, address owner);

    // MODIFIERS
	modifier onlyRelayer() {
		require(relayerStatus[msg.sender], "You are not allowed to perform this operation");
		_;
	}

    function getRelayerStatus(address relayer) public view returns(bool status) {
		status = relayerStatus[relayer];
	}

	function getAllRelayers() public view returns(address[] memory) {
		return relayers;
	}

    //Register new Relayer
	function addRelayers(address[] memory relayerArray) public onlyOwner {
		for(uint i = 0; i<relayerArray.length; i++) {
			require(relayerArray[i] != address(0), 'Relayer address cannot be zero');
			relayers.push(relayerArray[i]);
			relayerStatus[relayerArray[i]] = true;
			emit RelayerAdded(relayerArray[i], msg.sender);
		}
	}
}