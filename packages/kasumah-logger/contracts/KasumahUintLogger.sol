// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// This is useful for keeping track of separating lists of IDs
// especially to not rely on event logs which can be expensive.

contract KasumahUintLogger {
    using EnumerableSet for EnumerableSet.UintSet;

    mapping(address => mapping(address => bool)) private _approvals; // who is allowed to write for a user?
    mapping(bytes32 => EnumerableSet.UintSet) private _sets; // hash of address/key -> set

    EnumerableSet.UintSet private tournaments;

    function add(address user, string calldata key, uint id) public {
        requireApprovedSender(user);
        bytes32 hsh = hashKey(user, key);
        _sets[hsh].add(id);
    }

    function remove(address user, string calldata key, uint id) public {
        requireApprovedSender(user);
        bytes32 hsh = hashKey(user, key);
        _sets[hsh].remove(id);
    }

    function all(address user, string calldata key) public view returns (uint[] memory ids) {
        bytes32 hsh = hashKey(user, key);
        EnumerableSet.UintSet storage set = _sets[hsh];
        uint len = set.length();
        ids = new uint[](len);
        for (uint i; i < len; i++) {
            ids[i] = set.at(i);
        }
        return ids;
    }

    function slice(address user, string calldata key, uint start, uint len) public view returns (uint[] memory ids) {
        bytes32 hsh = hashKey(user, key);
        EnumerableSet.UintSet storage set = _sets[hsh];

        ids = new uint[](len);
        for (uint i = 0; i < len; i++) {
            ids[i] = set.at(start + i);
        }
        return ids;
    }

    function length(address user, string calldata key) public view returns (uint) {
        bytes32 hsh = hashKey(user, key);
        return _sets[hsh].length();
    }

    function setApproved(address user, bool isApproved) public {
        _approvals[msg.sender][user] = isApproved;
    }

    function requireApprovedSender(address user) internal view {
        require(user == msg.sender || _approvals[user][msg.sender], "must be the user or have an approval to log");
    }

    function hashKey(address user, string calldata key) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, key));
    }
}
