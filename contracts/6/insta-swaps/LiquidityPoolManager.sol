pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "./ReentrancyGuard.sol";
import "../libs/Pausable.sol";
import "../libs/Ownable.sol";
import "../RelayerManager.sol";
import "../interfaces/IERC20.sol";

contract LiquidityPoolManager is ReentrancyGuard, Ownable, BaseRelayRecipient, Pausable {
    using SafeMath for uint256;

    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    mapping ( address => bool ) public tokenMap;    // tokenAddress => active_status
    mapping ( address => mapping ( address => uint256) ) public liquidityProviderMap; // tokenAddress => LPaddress => amount
    mapping ( bytes32 => bool ) public sendFundsMap;
    RelayerManager relayerManager;

    struct ReceiverData {
		address _tokenAddress;
        uint256 _amount;
        address payable _destinations;
        string _depositHash;
	}

    event AssetSent(address indexed asset, uint256 amount, address target);
    event Received(address from, uint256 amount);

    // MODIFIERS
    modifier onlyRelayerOrOwner() {
        require(relayerManager.getRelayerStatus(_msgSender()) || _msgSender() == owner(),
            "You are not allowed to perform this operation"
        );
        _;
    }

    constructor(address _relayerManagerAddress,  address owner) public Ownable(owner) Pausable(owner) {
        require(_relayerManagerAddress != address(0), "RelayerManager Contract Address cannot be 0");
        relayerManager = RelayerManager(_relayerManagerAddress); 
        tokenMap[NATIVE] = true;
        trustedForwarder = address(this);
    }

    function versionRecipient() external override virtual view returns (string memory){
        return "1";
    }

    function getRelayerManager() public view returns (address){
        return address(relayerManager);
    }

    function changeTrustedForwarder( address forwarderAddress ) public onlyOwner {
        require(forwarderAddress != address(0), "Forwarder Address cannot be 0");
        trustedForwarder = forwarderAddress;
    }

    function addSupportedToken( address tokenAddress ) public onlyOwner {
        require(tokenAddress != address(0), "Token address cannot be 0");
        tokenMap[tokenAddress] = true;
    }

    function removeSupportedToken( address tokenAddress ) public onlyOwner {
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(tokenAddress != NATIVE, "Native currency can't be removed");
        tokenMap[tokenAddress] = false;
    }

    function addEthLiquidity() public payable onlyRelayerOrOwner whenNotPaused {
        require(msg.value > 0, "amount should be greater then 0");
        liquidityProviderMap[NATIVE][_msgSender()] = liquidityProviderMap[NATIVE][_msgSender()].add(msg.value);
    }

    function removeEthLiquidity(uint256 amount) public onlyRelayerOrOwner whenNotPaused {
        require(liquidityProviderMap[NATIVE][_msgSender()] >= amount, "Not enough balance");
        require(_msgSender().send(amount), "Native Transfer Failed");
        liquidityProviderMap[NATIVE][_msgSender()] = liquidityProviderMap[NATIVE][_msgSender()].sub(amount);
    }

    function addTokenLiquidity( address tokenAddress, uint256 amount ) public onlyRelayerOrOwner whenNotPaused {
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(tokenMap[tokenAddress], "Token not supported");
        require(amount > 0, "amount should be greater then 0");

        IERC20 erc20 = IERC20(tokenAddress);

        require(erc20.transferFrom(_msgSender(),address(this),amount),"Token Transfer Failed");

        liquidityProviderMap[tokenAddress][_msgSender()] = liquidityProviderMap[tokenAddress][_msgSender()].add(amount);
    }

    function removeTokenLiquidity( address tokenAddress, uint256 amount ) public onlyRelayerOrOwner whenNotPaused {
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(amount > 0, "amount should be greater then 0");
        require(liquidityProviderMap[tokenAddress][_msgSender()] >= amount, "Not enough balance");

        IERC20 erc20 = IERC20(tokenAddress);
        require(erc20.transfer(_msgSender(),amount),"Token Transfer Failed");

        liquidityProviderMap[tokenAddress][_msgSender()] = liquidityProviderMap[tokenAddress][_msgSender()].sub(amount);
    }

    function send( address tokenAddress, uint256 amount, address payable destination, string memory depositHash ) public nonReentrant onlyRelayerOrOwner whenNotPaused {
        require(destination != address(0), "Bad destination");
         
        bytes32 hashSendTransaction = keccak256(
            abi.encode(
                tokenAddress,
                amount,
                destination,
                keccak256(bytes(depositHash))
            )
        );
        require(sendFundsMap[hashSendTransaction],"Already Processed");

        if (tokenAddress == NATIVE) {
            require(address(this).balance > amount, "Not Enough Balance");
            require(destination.send(amount), "Native Transfer Failed");
        } else {
            IERC20 erc20 = IERC20(tokenAddress);
            require(erc20.transfer(destination,amount),"Token Transfer Failed");
        }

        sendFundsMap[hashSendTransaction] = true;
        emit AssetSent(tokenAddress, amount, tokenAddress);
    }

    function sendBulk( ReceiverData[] memory data ) public nonReentrant onlyRelayerOrOwner whenNotPaused {
        for (uint256 i = 0; i < data.length; i++) {
            require(data[i]._tokenAddress != address(0), "Bad tokenAddress");
            require(data[i]._amount != 0, "Bad Amount");
            send(data[i]._tokenAddress, data[i]._amount, data[i]._destinations, data[i]._depositHash);
        }
    }
}