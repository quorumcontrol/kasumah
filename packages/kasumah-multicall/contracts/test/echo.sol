pragma solidity >=0.7.0;

contract Echo {
    
    mapping(bytes32=>bool) public publicMapping;

    function echo(string memory data) public pure returns (string memory) {
        return data;
    }
}