pragma solidity 0.6.9;

import "./ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../libs/Ownable.sol";
import "./AccessControl.sol";
import "../RelayerManager.sol";


contract LiquidityPoolManager is ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;

    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    mapping ( address => bool) public tokenMap;    // tokenAddress => active_status
    mapping ( address => mapping ( address => uint256)) public liquidityProviderMap; // tokenAddress => LPaddress => amount
    RelayerManager relayerManager;

    event AssetSent(address indexed asset, uint256 amount, address target);
    event Received(address from, uint256 amount);

    // MODIFIERS
    modifier onlyRelayerOrOwner() {
        require(
            relayerManager.getRelayerStatus(msg.sender) || msg.sender == owner(),
            "You are not allowed to perform this operation"
        );
        _;
    }

    constructor(address _relayerManagerAddress,  address owner) public Ownable(owner) {
        require(_relayerManagerAddress != address(0), "RelayerManager Contract Address cannot be 0");
        relayerManager = RelayerManager(_relayerManagerAddress); 
        tokenMap[NATIVE] = true;
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

    function addEthLiquidity() public payable onlyRelayerOrOwner{
        require(msg.value > 0, "amount should be greater then 0");
        liquidityProviderMap[NATIVE][msg.sender] = liquidityProviderMap[NATIVE][msg.sender].add(msg.value);
    }

    function removeEthLiquidity(uint256 amount) public payable onlyRelayerOrOwner{
        require(liquidityProviderMap[NATIVE][msg.sender] >= amount, "Not enough balance");
        require(address(this).send(amount), "Native Transfer Failed");
        liquidityProviderMap[NATIVE][msg.sender] = liquidityProviderMap[NATIVE][msg.sender].sub(amount);
    }

    function addTokenLiquidity( address tokenAddress, uint256 amount ) public onlyRelayerOrOwner{
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(tokenMap[tokenAddress], "Token not supported");
        require(amount > 0, "amount should be greater then 0");

        (bool success, ) = tokenAddress.call(
            abi.encodeWithSignature(
                "transferFrom(address, address, uint256)",
                msg.sender,
                address(this),
                amount
            )
        );

        require(success, "Token Transfer Failed");
        
        liquidityProviderMap[tokenAddress][userAddress] = liquidityProviderMap[tokenAddress][userAddress].add(amount);
    }

    function removeTokenLiquidity( address tokenAddress, uint256 amount ) public nonReentrant onlyRelayerOrOwner {
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(amount > 0, "amount should be greater then 0");
        require(liquidityProviderMap[tokenAddress][userAddress] >= amount, "Not enough balance");

        send(tokenAddress, amount, msg.sender);

        liquidityProviderMap[tokenAddress][userAddress] = liquidityProviderMap[tokenAddress][userAddress].sub(amount);
    }

    function send( address tokenAddress, uint256 amount, address destination ) public nonReentrant onlyRelayerOrOwner {
        require(destination != address(0), "Bad destination");

        if (tokenAddress == NATIVE) {
            require(address(this).balance > amount, "Not Enough Balance");
            require(address(this).send(amount), "Native Transfer Failed");
        } else {
            (bool success, ) = tokenAddress.call(
                abi.encodeWithSignature(
                    "transfer(address, uint256)",
                    destination,
                    amount
                )
            );

            require(success, "Token Transfer Failed");
        }

        emit AssetSent(tokenAddress, amount, tokenAddress);
    }

    
    function sendBulk( address tokenAddress, uint256 amount, address[] calldata destinations ) external nonReentrant onlyRelayerOrOwner {
        require(tokenAddress != address(0), "Bad tokenAddress");
        require(amount != 0, "Bad Amount");

        for (uint256 i = 0; i < destinations.length; i++) {
            send(tokenAddress, amount, destinations[i]);
        }
    }

}
