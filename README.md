# Simple-Escrow-Bet

This project consists of 3 smart contracts "SUSDC", "EscrowBet" and "EscrowBetBonus", listed under `./contracts`

`SUSDC`

- standard ERC20 contract

`EscrowBet`

- deposit(uint option) : Accepts deposits from Alice and Bob, along with a parameter called option . Assume that 0 is $BTC < 25,000, and 1 is $BTC ≥ 25,000
- settle(uint option) : Can only be called by the contract owner during maturity. The winner will receive all the funds from the contract.

`EscrowBetBonus`

- Modified `EscrowBet` contract so that 20 people can bet on the outcomes together. There will be a window for people to place bets, and they can either choose option 1 or 2. The people in the winning group will split the rewards in the pool. Each unique address can only have one vote.

## Getting Started

```shell
npx hardhat test
```

