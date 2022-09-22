import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('AliceBob', function () {
  async function deployLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    const SUSDC = await ethers.getContractFactory('SUSDC');
    const sUSDC = await SUSDC.deploy();

    const EscrowBet = await ethers.getContractFactory('EscrowBet');
    const escrowBet = await EscrowBet.deploy(
      sUSDC.address,
      ethers.utils.parseUnits('1', '20') // setting default bet value to 100 sUSDC
    );
    return { owner, alice, bob, sUSDC, escrowBet };
  }

  describe('Initilisation', function () {
    it('Successful initialisation of SUSDC', async function () {
      const { sUSDC } = await loadFixture(deployLockFixture);

      expect(await sUSDC.totalSupply()).to.equal(
        ethers.utils.parseUnits('1', '24') // 1,000,000 sUSDC
      );
    });

    it('Successful initialisation of EscrowBet', async function () {
      const { owner, escrowBet } = await loadFixture(deployLockFixture);

      expect(await escrowBet.owner()).to.equal(owner.address);
    });
  });

  describe('Minting of sUSDC', function () {
    it('Successful minting of sUSDC to alice and bob', async function () {
      const { sUSDC, alice, bob } = await loadFixture(deployLockFixture);

      await sUSDC.mint(alice.address, ethers.utils.parseUnits('1', '20'));
      await sUSDC.mint(bob.address, ethers.utils.parseUnits('1', '20'));

      expect(await sUSDC.balanceOf(alice.address)).to.equal(
        ethers.utils.parseUnits('1', '20') // 100 sUSDC
      );

      expect(await sUSDC.balanceOf(bob.address)).to.equal(
        ethers.utils.parseUnits('1', '20') // 100 sUSDC
      );
    });
  });

  describe('Despoiting bets', function () {
    it('Successful deposit of bets', async function () {
      const { escrowBet, sUSDC, alice, bob } = await loadFixture(
        deployLockFixture
      );

      await sUSDC.mint(alice.address, ethers.utils.parseUnits('1', '20'));
      await sUSDC.mint(bob.address, ethers.utils.parseUnits('1', '20'));

      await sUSDC
        .connect(alice)
        .approve(escrowBet.address, ethers.utils.parseUnits('1', '20'));

      await escrowBet.connect(alice).deposit(1);

      expect(await escrowBet.checkAliceBet()).to.equal(
        ethers.utils.parseUnits('1', '20') // 100 sUSDC
      );

      expect(await sUSDC.balanceOf(alice.address)).to.equal(
        0 // 0 sUSDC
      );
    });
  });

  describe('Settling of bets', function () {
    it('Successful settling of bets', async function () {
      const { escrowBet, sUSDC, alice, bob } = await loadFixture(
        deployLockFixture
      );

      await sUSDC.mint(alice.address, ethers.utils.parseUnits('1', '20'));
      await sUSDC.mint(bob.address, ethers.utils.parseUnits('1', '20'));

      await sUSDC
        .connect(alice)
        .approve(escrowBet.address, ethers.utils.parseUnits('1', '20'));

      await escrowBet.connect(alice).deposit(1);

      await sUSDC
        .connect(bob)
        .approve(escrowBet.address, ethers.utils.parseUnits('1', '20'));

      await escrowBet.connect(bob).deposit(0);

      await sUSDC.approve(
        escrowBet.address,
        ethers.utils.parseUnits('2', '20')
      );

      await escrowBet.settle(1);

      expect(await sUSDC.balanceOf(alice.address)).to.equal(
        ethers.utils.parseUnits('2', '20') // Alice Won - 200 sUSDC
      );

      expect(await sUSDC.balanceOf(bob.address)).to.equal(
        0 // Bob loss - 0 sUSDC
      );
    });

    it('Only owner can settle bets', async function () {
      const { escrowBet, sUSDC, alice, bob } = await loadFixture(
        deployLockFixture
      );

      await sUSDC.mint(alice.address, ethers.utils.parseUnits('1', '20'));
      await sUSDC.mint(bob.address, ethers.utils.parseUnits('1', '20'));

      await sUSDC
        .connect(alice)
        .approve(escrowBet.address, ethers.utils.parseUnits('1', '20'));

      await escrowBet.connect(alice).deposit(1);

      await sUSDC
        .connect(bob)
        .approve(escrowBet.address, ethers.utils.parseUnits('1', '20'));

      await escrowBet.connect(bob).deposit(0);

      await sUSDC.approve(
        escrowBet.address,
        ethers.utils.parseUnits('2', '20')
      );

      await expect(escrowBet.connect(alice).settle(1)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });
  });
});
