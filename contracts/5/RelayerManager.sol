pragma solidity 0.5.13;
import "./libs/Ownable.sol";

contract RelayerManager is Ownable {
    address[] internal relayers;
    mapping(address => bool) internal relayerStatus;

    event RelayerAdded(address relayer, address owner);

    constructor(address owner) public Ownable(owner) {
        // Empty constructor to pass owner as parameter during deployment
    }

    function getRelayerStatus(address relayer)
        public
        view
        returns (bool status)
    {
        status = relayerStatus[relayer];
    }

    function getAllRelayers() public view returns (address[] memory) {
        return relayers;
    }

    //Register new Relayers
    function addRelayers(address[] memory relayerArray) public onlyOwner {
        for (uint256 i = 0; i < relayerArray.length; i++) {
            require(
                relayerArray[i] != address(0),
                "Relayer address cannot be zero"
            );
            relayers.push(relayerArray[i]);
            relayerStatus[relayerArray[i]] = true;
            emit RelayerAdded(relayerArray[i], msg.sender);
        }
    }

    // Register single relayer
    function addRelayer(address relayerAddress) public onlyOwner {
        require(relayerAddress != address(0), "relayer address can not be 0");
        relayers.push(relayerAddress);
        relayerStatus[relayerAddress] = true;
        emit RelayerAdded(relayerAddress, msg.sender);
    }
}
