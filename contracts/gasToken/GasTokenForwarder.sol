pragma solidity 0.5.13;
import "./ICHITOKEN.sol";
import "../RelayerManager.sol";
import "../libs/Ownable.sol";
import "./GasTokenImplementation.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract GasTokenForwarder is Ownable {
    using SafeMath for uint256;

    ICHITOKEN public chiToken;
    RelayerManager public relayerManager;
    GasTokenImplementation public gasTokenImplementation;
    address public gasTokenImplAddress;

    // MODIFIERS
    modifier onlyRelayerOrOwner() {
        require(
            relayerManager.getRelayerStatus(msg.sender) || msg.sender == owner(),
            "You are not allowed to perform this operation"
        );
        _;
    }

    constructor(
        address owner,
        address _chiTokenAddress,
        address _relayerManagerAddress,
        address _gasTokenImplAddress
    ) public Ownable(owner) {
        require(_chiTokenAddress != address(0), "ChiToken Contract Address cannot be 0");
        require(_relayerManagerAddress != address(0), "RelayerManager Contract Address cannot be 0");
        require(_gasTokenImplAddress != address(0), "GasTokenImpl Contract Address address cannot be 0");

        chiToken = ICHITOKEN(_chiTokenAddress);
        relayerManager = RelayerManager(_relayerManagerAddress);
        gasTokenImplementation = GasTokenImplementation(_gasTokenImplAddress);
        gasTokenImplAddress = _gasTokenImplAddress;
    }

    function addRelayerManager(address _relayerManagerAddress) public onlyOwner {
        require(
            _relayerManagerAddress != address(0),
            "Manager address can not be 0"
        );
        relayerManager = RelayerManager(_relayerManagerAddress);
    }

    function addGasTokenImpl(address _gasTokenImplAddress) public onlyOwner {
        require(
            _gasTokenImplAddress != address(0),
            "Implementation Contract address can not be 0"
        );
        gasTokenImplementation = GasTokenImplementation(_gasTokenImplAddress);
    }

    function addChiAddress(address _chiTokenAddress) public onlyOwner {
        require(
            _chiTokenAddress != address(0),
            "ChiTokenAddress contract address can not be 0"
        );
        chiToken = ICHITOKEN(_chiTokenAddress);
    }

    function balanceOfGasToken(address who) external view returns (uint256) {
        return chiToken.balanceOf(who);
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return chiToken.allowance(owner, spender);
    }

    function() external payable onlyRelayerOrOwner {
        address _gasTokenImplAddress = gasTokenImplAddress;
        assembly {
            calldatacopy(0x0, 0x0, calldatasize)
            let result := delegatecall(gas, _gasTokenImplAddress, 0x0, calldatasize, 0x0, 0)
            returndatacopy(0x0, 0x0, returndatasize)
            switch result case 0 {revert(0, 0)} default {return (0, returndatasize)}
        }
    }
}
