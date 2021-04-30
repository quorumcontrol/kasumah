pragma solidity >=0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Echo is Ownable {
    
    event Echoed(bytes32 indexed key, bytes32 value);

    mapping(bytes32=>bytes32) public publicMapping;

    function echo(string memory data) public pure returns (string memory) {
        return data;
    }

    function setMapping(bytes32 key, bytes32 val) public onlyOwner {
        publicMapping[key] = val;
        emit Echoed(key, val);
    }

    function setValueMapping(bytes32 key) public payable onlyOwner {
        bytes32 val = bytes32(msg.value);
        publicMapping[key] = val;
        emit Echoed(key, val);
    }

}