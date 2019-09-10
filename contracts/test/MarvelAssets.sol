pragma solidity ^0.5.0;
import "../libs/Ownable.sol";

contract MarvelAssets is Ownable {
	struct Asset {
		uint id;
		string name;
		bool valid;
	}

	event AssetAdded(address indexed creator, uint256 id, string name);
	event AssetBought(address indexed buyer, uint256 id);

	mapping(uint => address) assetOwner;
	uint256[] assetIdList;
	mapping(uint => Asset) assets;

	constructor() Ownable(msg.sender) public {
		Asset memory ironManHelmet = Asset({id: 1, name: "Iron Man Helmet", valid: true});
		Asset memory captainAmericaShield = Asset({id: 2, name: "Iron Man Helmet", valid: true});
		Asset memory thorHammer = Asset({id: 3, name: "Mjolnir", valid: true});
		assets[ironManHelmet.id] = ironManHelmet;
		assets[captainAmericaShield.id] = captainAmericaShield;
		assets[thorHammer.id] = thorHammer;
		assetIdList.push(ironManHelmet.id);
		assetIdList.push(captainAmericaShield.id);
		assetIdList.push(thorHammer.id);
	}

	function addAsset(uint id, string memory name) public onlyOwner {
		require(!assets[id].valid, "Asset already exists with current id");
		Asset memory newAsset = Asset({id: id, name: name, valid: true});
		assets[id] = newAsset;
		assetIdList.push(id);
		emit AssetAdded(msg.sender, id, name);
	}

	function buyAsset(uint id) public {
		assetOwner[id] = msg.sender;
		emit AssetBought(msg.sender, id);
	}

	function getOnwer(uint256 id) public view returns(address) {
		require(assets[id].valid, "Asset does not exists");
		return assetOwner[id];
	}

	function getAllAssetId() public view returns(uint256[] memory) {
		return assetIdList;
	}
}