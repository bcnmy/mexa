pragma solidity ^0.6.2;
import "./libs/Ownable.sol";
import "./EternalStorage.sol";


contract IdentityProxy is EternalStorage, Ownable {
    event ManagerChanged(address oldManager, address newManager);

    modifier onlyOwnerOrManager() {
        require(
            msg.sender == manager || msg.sender == owner(),
            "Not the Owner or Manager"
        );
        _;
    }

    constructor(address owner, address _implementation) public Ownable(owner) {
        creator = msg.sender;
        manager = msg.sender;
        implementation = _implementation;
    }

    function updateImplementation(address _newImplementation)
        external
        onlyOwnerOrManager
    {
        require(
            _newImplementation != address(0),
            "Implementation address can not be zero"
        );
        implementation = _newImplementation;
    }

    function getCreator() public view returns (address) {
        return creator;
    }

    function getManager() public view returns (address) {
        return manager;
    }

    function changeManager(address newManager) public onlyOwner {
        require(
            newManager != address(0),
            "New Manager address can not be zero"
        );
        address oldManager = manager;
        manager = newManager;
        emit ManagerChanged(oldManager, newManager);
    }

    function getNonce(uint256 batchId) public view returns (uint256) {
        return batchNonce[batchId];
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable {
        require(
            msg.sender == manager || msg.sender == owner(),
            "Not the Owner or Manager"
        );
        address impl = implementation;
        require(impl != address(0));
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), impl, ptr, calldatasize(), 0, 0)
            let size := returndatasize()
            returndatacopy(ptr, 0, size)

            switch result
                case 0 {
                    revert(ptr, size)
                }
                default {
                    return(ptr, size)
                }
        }
    }
}
