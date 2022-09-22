# Suberra Protocol

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

### Extra questions

Q3 b) Can you think of a better way to replace settle(uint option) with on- chain data?

ans) Yes. To improve the settle function, we can remove the need for the owner to check the price of the BTC and have the contract do it instead. This means, the function will need to retrieve and check the price of BTC without the help of the owner. The smart contract can import chainlink price feed contract which can allow the escrow smart contract to fetch the latest price of BTC. Afterwhich, a simple if functionality can be implemented to segment between options 0 and 1. This would be a better way to implement the `settle()` function.

### Questions

1. What are the pros and cons of using blockchain as a database

Pro :

- Fully decentralised and no single point of failure
- Immutability which prevents people to change the data without breaking the chain

Cons :

- Data can only be read or added to the blockchain, whereas on databases, data can be created, read, updated or deleted.
  Mitigation:
  Data which requires CRUD operations can be handled off-chain on databases such as MongoDB
- Slow and expensive queries
  Mitigation:
  GraphQL can be used to track events emitted by the smart contract which can optimise REST queries into Better REST queries

3. What are some of the ways that a contract can be upgraded to include new functions? What are the pros and cons of each method?

A contract can be upgraded with openzeppelin's contract upgradeable contracts through imports. A pro of using upgradeable contract allows the flexibility to fix bugs, but a con is that a privileged role is in charge of handling the upgrades. This means the privileged role might abuse its power and change the implementation to his/her benefits.

`Delegate Calls`
Pros : Contract A can delegate calls to contract B to make changes to contract A storage.
Cons : This gives rise to a vulnerability caused by function selector clashses.

`Pausable`
Pros : Pausing switch is a good safeguard for the team to react and fix vulnerabilities
Cons : This would mean its centralised and if not implemented carefully, it can negate the effects of a timelock.

`Escape Hatches`
Pros : Allow users to exit the system even when it is paused.
Cons : If not implemented carefully, a bug can render the system helpless while an attacker drains its funds.
