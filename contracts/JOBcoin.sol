pragma solidity ^0.8.10;

contract JOBcoin {
    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event LogMessage(string message);
    event LogNumber(uint256 nr);
    event LogAddress(address ad);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = _totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Check if the sender has enough tokens
        //emit LogNumber(balanceOf[msg.sender]);
        emit LogNumber(balanceOf[msg.sender]);
        emit LogNumber(_value);
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");

        // Transfer tokens from sender to receiver
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // Check if the sender has enough tokens and is allowed to spend the specified amount
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Not authorized to spend");

        // Transfer tokens from sender to receiver
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;

        // Update allowance
        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

}
