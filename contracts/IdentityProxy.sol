pragma solidity ^0.5.13;
import "./libs/Ownable.sol";
import "./EternalStorage.sol";


contract IdentityProxy is EternalStorage {
    constructor(address _owner, address _implementation) public {
        creator = msg.sender;
        manager = msg.sender;
        implementation = _implementation;
        owner = _owner;
    }

    function updateImplementation(address _newImplementation) external {
        require(
            msg.sender == manager || msg.sender == owner,
            "Not the Owner or Manager"
        );
        require(_newImplementation != address(0), "Address can't be 0");
        implementation = _newImplementation;
    }

    function() external payable {
        if (msg.data.length == 0) {
            emit Received(msg.sender, msg.value);
        } else {
            require(
                msg.sender == manager || msg.sender == owner,
                "Not the Owner or Manager"
            );
            address impl = implementation;
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
    }
}
