// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import './SUSDC.sol';


contract EscrowBet is Ownable {
    SUSDC private _token;

    struct Player {
        address playerAddress; // alice or bob address
        uint256 bet; // bet value 
        uint option; // 0 or 1
    }

    mapping (uint256 => Player) private _players; // Storing alice and bob

    address _owner; 
    uint256 _betPrice; // Ensure consistent bet price

    constructor (
        SUSDC token_,
        uint256 betPrice_
    ) {
        _token = token_;
        _owner = payable(msg.sender);
        _betPrice = betPrice_;
    }

    /**
        @dev Deposit of bet option between 2 parties
        0 : $BTC < 25,000
        1 : $BTc > 25,000

        Requirements: 
        - value can only be 1 or 0 
        - only 2 parties (alice and bob) can enter 1 contract
        - both parties must put the same amount of funds
     */
    function deposit(uint option) public
        checkOption(option)
        checkDeposit()
    {
        _token.transferFrom(msg.sender,_owner, _betPrice);
        if (_players[0].playerAddress == address(0)) { 
            _players[0].playerAddress = msg.sender;
            _players[0].bet = _betPrice;
            _players[0].option = option;

        } else {
            _players[1].playerAddress = msg.sender;
            _players[1].bet = _betPrice;
            _players[1].option = option;
        }
    }

    /**
        @dev Settling of bet upon maturity

        Requirements: 
        - called only by contract owner
        - winner will receive all the funds
     */
    function settle(uint option) public onlyOwner
        checkDeposited()
    {
        uint256 totalFunds = _betPrice * 2;
        if (_players[0].option == option) {
            _token.transferFrom(_owner,_players[0].playerAddress, totalFunds);
        } else {
            _token.transferFrom(_owner,_players[1].playerAddress, totalFunds); 
        }
        // Reset Alice and Bob
        _players[0].playerAddress = address(0);
        _players[1].playerAddress = address(0);
    }

    modifier checkOption(uint option) {
        require(option == 1 || option == 0, "option value must be 1 or 0");
        _;
    }

    modifier checkDeposit() {
        require(_players[0].playerAddress == address(0) || _players[1].playerAddress == address(0), "Alice and Bob have already deposited");
        _;
    }

    modifier checkDeposited() {
        require(_players[0].playerAddress != address(0) && _players[1].playerAddress != address(1), "Alice and Bob have not deposited");
        _;
    }

    function checkAliceBet() public view returns(uint256) {
        return _players[0].bet;
    }

    function checkBobBet() public view returns(uint256) {
        return _players[1].bet;
    }
}