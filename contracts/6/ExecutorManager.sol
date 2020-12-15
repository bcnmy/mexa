pragma solidity 0.6.9;

import "./libs/Ownable.sol";


contract ExecutorManager is Ownable(msg.sender) {
    address[] internal executors;
    mapping(address => bool) internal executorStatus;

    event ExecutorAdded(address executor, address owner);

    // MODIFIERS
    modifier onlyExecutor() {
        require(
            executorStatus[msg.sender],
            "You are not allowed to perform this operation"
        );
        _;
    }

    function getExecutorStatus(address executor)
        public
        view
        returns (bool status)
    {
        status = executorStatus[executor];
    }

    function getAllExecutors() public view returns (address[] memory) {
        return executors;
    }

    //Register new Executors
    function addExecutors(address[] memory executorArray) public onlyOwner {
        for (uint256 i = 0; i < executorArray.length; i++) {
            require(
                executorArray[i] != address(0),
                "Executor address cannot be zero"
            );
            executors.push(executorArray[i]);
            executorStatus[executorArray[i]] = true;
            emit ExecutorAdded(executorArray[i], msg.sender);
        }
    }

    // Register single executor
    function addExecutor(address executorAddress) public onlyOwner {
        require(executorAddress != address(0), "executor address can not be 0");
        executors.push(executorAddress);
        executorStatus[executorAddress] = true;
        emit ExecutorAdded(executorAddress, msg.sender);
    }
}
