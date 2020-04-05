pragma solidity ^0.5.13;
import "./libs/SafeMath.sol";
import "./EternalStorage.sol";
import "./libs/Ownable.sol";


contract ImplementationLogic is EternalStorage {
    using SafeMath for uint256;

    modifier onlyOwnerOrManager() {
        require(
            msg.sender == manager || msg.sender == owner,
            "Not the Owner or Manager"
        );
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(
            isOwner(),
            "Only contract owner is allowed to perform this operation"
        );
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function updateImplementation(address _newImplementation)
        external
        onlyOwnerOrManager
    {
        require(_newImplementation != address(0), "Address can't be 0");
        implementation = _newImplementation;
    }

    function changeManager(address newManager) public onlyOwner {
        require(newManager != address(0), "Address can't be 0");
        emit ManagerChanged(manager, newManager);
        manager = newManager;
    }

    function forward(
        address payable destination,
        uint256 amount,
        bytes memory data,
        uint256 gasLimit,
        uint256 batchId
    ) public payable onlyOwnerOrManager {
        require(
            executeCall(destination, amount, data, gasLimit),
            "ExecuteCall() failed"
        );
        batchNonce[batchId] = batchNonce[batchId].add(1);
        emit Forwarded(destination, amount, data);
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(
        address to,
        uint256 amount,
        bytes memory data,
        uint256 gasLimit
    ) internal returns (bool success) {
        assembly {
            let txGas := gas
            if not(eq(gasLimit, 0)) {
                txGas := gasLimit
            }
            success := call(
                txGas,
                to,
                amount,
                add(data, 0x20),
                mload(data),
                0,
                0
            )
        }
    }

    function withdraw(address payable receiver, uint256 amount, uint256 batchId)
        public
        onlyOwnerOrManager
    {
        require(
            address(this).balance >= amount,
            "You dont have enough balance to withdraw"
        );
        receiver.transfer(amount);
        batchNonce[batchId] = batchNonce[batchId].add(1);
        emit Withdraw(receiver, amount);
    }
}
