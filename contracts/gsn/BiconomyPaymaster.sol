pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import "@opengsn/gsn/contracts/BasePaymaster.sol";

contract BiconomyPaymaster is BasePaymaster {
	mapping(address => bool) private targetMap;   // The target contracts we are willing to pay for

	event TargetAdded(address indexed target);
	event TargetsAdded(address[] targets);
    event TargetRemoved(address indexed target);

    // Allow the owner to set ourTarget
	function setTarget(address target, bool status) external onlyOwner {
		targetMap[target] = status;
        if(status) {
            emit TargetAdded(target);
        } else {
            emit TargetRemoved(target);
        }
	}

	function addTargets(address[] calldata targets) external onlyOwner {
		for(uint index = 0; index < targets.length; index++) {
			targetMap[targets[index]] = true;
		}
		emit TargetsAdded(targets);
	}

	function getTargetStatus(address target) public view returns(bool status) {
		status = targetMap[target];
	}

	// GNSTypes.RelayRequest is defined in GNSTypes.sol.
	// The relevant fields for us are:
	// target - the address of the target contract
	// encodedFunction - the called function's name and parameters
	// relayData.senderAddress - the sender's address
	function acceptRelayedCall(
		GSNTypes.RelayRequest calldata relayRequest,
		bytes calldata approvalData,
		uint256 maxPossibleGas
	) external view override returns (bytes memory context) {
		(approvalData, maxPossibleGas);  // avoid a warning

		require(targetMap[relayRequest.target], "Unauthorized request");

		// If we got here, we're successful. Return the time
		// to be able to match PreRelayed and PostRelayed events
		return abi.encode(block.number);
	}

	event PreRelayed(uint);
	event PostRelayed(uint);

	function preRelayedCall(
		bytes calldata context
	) external relayHubOnly override returns(bytes32) {
		emit PreRelayed(abi.decode(context, (uint)));
		return bytes32(0);
	}

	function postRelayedCall(
		bytes calldata context,
		bool success,
		bytes32 preRetVal,
		uint256 gasUse,
		GSNTypes.GasData calldata gasData
	) external relayHubOnly override {
		(success, preRetVal, gasUse, gasData);
		emit PostRelayed(abi.decode(context, (uint)));
	}
}