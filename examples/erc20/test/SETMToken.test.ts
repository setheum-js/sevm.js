import { expect, use } from 'chai';
import { ethers, Contract, BigNumber } from 'ethers';
import { deployContract, solidity } from 'ethereum-waffle';
import { TestAccountSigningKey, TestProvider, Signer, evmChai } from '@setheum.js/setters';
import { WsProvider } from '@polkadot/api';
import { createTestPairs } from '@polkadot/keyring/testingPairs';
import ADDRESS from '@setheum-labs/predeploy-contracts/utils/Address';

use(solidity);
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider('ws://127.0.0.1:9944')
});

const ERC20_ABI = require('@setheum-labs/predeploy-contracts/build/contracts/Token.json').abi;

describe('SETMToken', () => {
  let wallet: Signer;
  let walletTo: Signer;
  let token: Contract;

  before(async () => {
    [wallet, walletTo] = await provider.getWallets();
    token = new ethers.Contract(ADDRESS.SETM, ERC20_ABI, wallet as any);
  });

  after(async () => {
    provider.api.disconnect();
  });

  it('get token name', async () => {
    const name = await token.name();
    expect(name).to.equal('Setheum');
  });

  it('get token symbol', async () => {
    const symbol = await token.symbol();
    expect(symbol).to.equal('SETM');
  });

  it('get token decimals', async () => {
    const decimals = await token.decimals();
    expect(decimals).to.equal(12);
  });

  it('Transfer adds amount to destination account', async () => {
    const balance = await token.balanceOf(await walletTo.getAddress());
    await token.transfer(await walletTo.getAddress(), 7);
    expect((await token.balanceOf(await walletTo.getAddress())).sub(balance)).to.equal(7);
  });

  it('Transfer emits event', async () => {
    await expect(token.transfer(await walletTo.getAddress(), 7))
      .to.emit(token, 'Transfer')
      .withArgs(await wallet.getAddress(), await walletTo.getAddress(), 7);
  });

  it('Can not transfer above the amount', async () => {
    const balance = await token.balanceOf(await wallet.getAddress());
    await expect(token.transfer(await walletTo.getAddress(), balance.add(7))).to.be.reverted;
  });
});
