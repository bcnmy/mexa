pragma solidity ^0.5.13;
import "./libs/Ownable.sol";
import "./EternalStorage.sol";

contract IdentityProxy is EternalStorage, Ownable {
    using SafeMath for uint256;

    event Forwarded (address indexed destination, uint amount, bytes data);
    event Received (address indexed sender, uint amount);
    event Withdraw (address indexed receiver, uint amount);
    event TransferERC20(address indexed tokenAddress, address indexed receiver, uint256 amount);
    event TransferERC721(address indexed tokenAddress, address indexed receiver, uint256 tokenId);
    event ManagerChanged(address oldManager, address newManager);

    modifier onlyOwnerOrManager() {
        require(msg.sender == manager || msg.sender == owner(),"Not the Owner or Manager");
        _;
    }

    constructor(address owner, address _implementation) Ownable(owner) public {
        creator = msg.sender;
        manager = msg.sender;
        Implementation = _implementation;
    }

    function updateImplementation(address _newImplementation)
        external
        onlyOwnerOrManager
    {
        Implementation = _newImplementation;
    }

    function getCreator() public view returns (address) {
        return creator;
    }

    function getManager() public view returns(address) {
        return manager;
    }

    function changeManager(address newManager) public onlyOwner {
        require(newManager != address(0), "New Manager address can not be zero");
        address oldManager = manager;
        manager = newManager;
        emit ManagerChanged(oldManager, newManager);
    }

    function getNonce(uint256 batchId) public view returns(uint256){
        return batchNonce[batchId];
    }

   function() external payable {
        if (msg.data.length == 0) {
            emit Received(msg.sender, msg.value);
        } else {
            address impl = Implementation;
            require(impl != address(0));
            assembly {
                let ptr := mload(0x40)
                calldatacopy(ptr, 0, calldatasize)
                let result := delegatecall(gas, impl, ptr, calldatasize, 0, 0)
                let size := returndatasize
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
