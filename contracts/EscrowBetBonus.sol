// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import './SUSDC.sol';


contract EscrowBetBonus is Ownable {
    SUSDC private _token;

    struct Player {
        address playerAddress; // alice or bob address
        uint option; // 0 or 1
    }

    mapping (uint256 => Player) private _players; // Storing alice and bob
    uint256 private _playerId;
    uint256 private bet0;
    uint256 private bet1;

    address _owner; 
    uint256 _betPrice; // Ensure consistent bet price
    bool _window; // window for owner to set open or close

    constructor (
        SUSDC token_,
        uint256 betPrice_
    ) {
        _token = token_;
        _owner = msg.sender;
        _betPrice = betPrice_;
        _window = true;
    }

    /**
        @dev Deposit of bet option between 2 parties
        0 : $BTC < 25,000
        1 : $BTc > 25,000

        Requirements: 
        - value can only be 1 or 0 
        - up to 20 people can bet on the outcomes together
        - all parties must put the same amount of funds
        - there is a window for people to place bets
     */
    function deposit(uint option) public
        checkOption(option)
        checkLimit()
        checkWindow()
    {
        _token.transferFrom(msg.sender,_owner, _betPrice);
        _players[_playerId].playerAddress = msg.sender;
        _players[_playerId].option = option;
        if (option == 0) {
            bet0++;
        } else {
            bet1++;
        }
        _playerId++;
    }

    /**
        @dev Settling of bet upon maturity

        Requirements: 
        - called only by contract owner
        - winner will receive all the funds
     */
    function settle(uint option) public onlyOwner
    {
        uint256 totalFunds = SafeMath.mul(_betPrice, _playerId);
        uint256 winningAvg;
        if (option == 0) {  
            winningAvg = SafeMath.div(totalFunds,bet0);
        } else {
            winningAvg = SafeMath.div(totalFunds,bet1);
        }
        for (uint256 i = 0; i < _playerId; i++) {
            if (_players[i].option == option) {
                _token.transferFrom(_owner,_players[i].playerAddress, winningAvg);
            }        
        }
        // Reset
        _playerId = 0;
        bet0 = 0;
        bet1 = 0;
    }

    function window(bool open) public onlyOwner returns(bool){
        _window = open;
        return _window;
    }

    modifier checkWindow() {
        require(_window, "Window is closed");
        _;
    }

    modifier checkOption(uint option) {
        require(option == 1 || option == 0, "option value must be 1 or 0");
        _;
    }

    modifier checkLimit() {
        require(_playerId <= 20, "A limit of 20 players have been reached");
        _;
    }

}