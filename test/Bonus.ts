import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Bonus', function () {
  async function deployLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const players = [];
    for (let i = 1; i <= 20; i++) {
      const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
      await owner.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther('1'),
      });
      players.push(wallet);
    }
    const SUSDC = await ethers.getContractFactory('SUSDC');
    const sUSDC = await SUSDC.connect(owner).deploy();

    const EscrowBetBonus = await ethers.getContractFactory('EscrowBetBonus');
    const escrowBetBonus = await EscrowBetBonus.connect(owner).deploy(
      sUSDC.address,
      ethers.utils.parseUnits('1', '20') // setting default bet value to 100 sUSDC
    );
    return {
      owner,
      players,
      sUSDC,
      escrowBetBonus,
    };
  }

  describe('Initilisation', function () {
    it('Successful initialisation of SUSDC', async function () {
      const { sUSDC } = await loadFixture(deployLockFixture);

      expect(await sUSDC.totalSupply()).to.equal(
        ethers.utils.parseUnits('1', '24') // 1,000,000 sUSDC
      );
    });

    it('Successful initialisation of escrowBetBonus', async function () {
      const { owner, escrowBetBonus } = await loadFixture(deployLockFixture);

      expect(await escrowBetBonus.owner()).to.equal(owner.address);
    });
  });

  describe('Minting of sUSDC', function () {
    it('Successful minting of sUSDC to player1', async function () {
      const { sUSDC, players } = await loadFixture(deployLockFixture);

      await sUSDC.mint(players[1].address, ethers.utils.parseUnits('1', '20'));

      expect(await sUSDC.balanceOf(players[1].address)).to.equal(
        ethers.utils.parseUnits('1', '20') // 100 sUSDC
      );
    });
  });

  describe('Despoiting bets', function () {
    it('Successful deposit of player1', async function () {
      const { escrowBetBonus, sUSDC, players } = await loadFixture(
        deployLockFixture
      );

      await sUSDC.mint(players[1].address, ethers.utils.parseUnits('1', '20'));

      await sUSDC
        .connect(players[1])
        .approve(escrowBetBonus.address, ethers.utils.parseUnits('1', '20'));

      await escrowBetBonus.connect(players[1]).deposit(1);

      expect(await sUSDC.balanceOf(players[1].address)).to.equal(
        0 // 0 sUSDC
      );
    });

    it('Failure deposit of player1 on closed window', async function () {
      const { escrowBetBonus, sUSDC, players } = await loadFixture(
        deployLockFixture
      );

      await sUSDC.mint(players[1].address, ethers.utils.parseUnits('1', '20'));

      await sUSDC
        .connect(players[1])
        .approve(escrowBetBonus.address, ethers.utils.parseUnits('1', '20'));

      await escrowBetBonus.window(false);

      await expect(
        escrowBetBonus.connect(players[1]).deposit(1)
      ).to.be.revertedWith('Window is closed');
    });

    it('Failure 2 times deposit of player1', async function () {
      const { escrowBetBonus, sUSDC, players } = await loadFixture(
        deployLockFixture
      );

      await sUSDC.mint(players[1].address, ethers.utils.parseUnits('2', '20'));

      await sUSDC
        .connect(players[1])
        .approve(escrowBetBonus.address, ethers.utils.parseUnits('2', '20'));

      await escrowBetBonus.connect(players[1]).deposit(1);

      await expect(
        escrowBetBonus.connect(players[1]).deposit(1)
      ).to.be.revertedWith('You have already voted');
    });
  });

  describe('Settling of bets', function () {
    it('Successful settling of bets', async function () {
      const { escrowBetBonus, owner, sUSDC, players } = await loadFixture(
        deployLockFixture
      );

      for (let i = 0; i < 20; i++) {
        await sUSDC.mint(
          players[i].address,
          ethers.utils.parseUnits('1', '20')
        );
        await sUSDC
          .connect(players[i])
          .approve(escrowBetBonus.address, ethers.utils.parseUnits('1', '20'));
        if (i != 19) {
          await escrowBetBonus.connect(players[i]).deposit(0);
        }
      }

      await escrowBetBonus.connect(players[19]).deposit(1);

      await sUSDC.approve(
        escrowBetBonus.address,
        ethers.utils.parseUnits('20', '20')
      );

      await escrowBetBonus.settle(1);

      expect(await sUSDC.balanceOf(players[19].address)).to.equal(
        ethers.utils.parseUnits('20', '20') // Alice Won - 200 sUSDC
      );
    });
  });
});
