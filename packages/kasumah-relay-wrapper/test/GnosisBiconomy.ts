import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Echo } from "../types/ethers-contracts/Echo";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { wrapContract } from "../src";
import { GnosisBiconomy } from "../src/relayers";
import { WalletMaker, deployCanonicals, safeFromAddr } from "kasumah-wallet";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { ExecParams } from "../src/relayers/GnosisHelpers";
import { GnosisSafe__factory } from "kasumah-wallet/dist/types/ethers-contracts/factories/GnosisSafe__factory";

describe("GnosisBiconomy", () => {
  let chainId: number;
  let echo: Echo;
  let deployer: SignerWithAddress;
  let signers: SignerWithAddress[];
  let alice: SignerWithAddress;
  let walletMaker: WalletMaker;

  let axiosMock: MockAdapter;

  const testKey = utils.formatBytes32String("test");
  const testValue = utils.formatBytes32String("value");

  before(() => {
    axiosMock = new MockAdapter(axios);
  });

  after(() => {
    axiosMock.reset();
  });

  beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });

    signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];

    chainId = network.config.chainId!;

    await deployCanonicals(deployer);

    walletMaker = new WalletMaker({ signer: deployer, chainId });

    const aliceSafeAddr = await walletMaker.walletAddressForUser(alice.address);

    const EchoFactory = await ethers.getContractFactory("Echo");
    echo = (await EchoFactory.deploy()) as Echo;
    await echo.deployed();

    await echo.transferOwnership(aliceSafeAddr);
  });

  it("multisends", async () => {
    await walletMaker.deployWallet(alice.address);

    const factory = new GnosisSafe__factory(deployer);

    // mock out biconomy to do the local relay and return a response similar to what they do
    axiosMock.onPost().reply(async (config) => {
      const postedData = JSON.parse(config.data);
      const params: ExecParams = [...postedData.params, {gasLimit: 9500000}] as any as ExecParams;
      
      const safe = factory.attach(postedData.to);
      const tx = await safe.execTransaction(...params);

      return [200, { txHash: tx.hash }];
    });

    const relayer = new GnosisBiconomy({
      apiKey: "testkey",
      apiId: "testid",
      userSigner: alice,
      chainId,
      targetChainProvider: deployer.provider!,
      httpClient: axios,
    });

    const tx1 = await echo.populateTransaction.setMapping(utils.formatBytes32String('multi'), utils.formatBytes32String('send'))
    const tx2 = await echo.populateTransaction.setMapping(utils.formatBytes32String('multi2'), utils.formatBytes32String('send2'))
    if (!tx1.data || !tx2.data) {
      throw new Error("error on data")
    }

    const resp = await relayer.multisend([tx1,tx2])

    await resp.wait();
    expect(await echo.publicMapping(utils.formatBytes32String('multi'))).to.equal(utils.formatBytes32String('send'));
    expect(await echo.publicMapping(utils.formatBytes32String('multi2'))).to.equal(utils.formatBytes32String('send2'));
  })

  describe('sending transactions', () => {
    let relayer:GnosisBiconomy
    let wrapped:Echo

    beforeEach(async () => {
      await walletMaker.deployWallet(alice.address);

      const factory = new GnosisSafe__factory(deployer);

      // mock out biconomy to do the local relay and return a response similar to what they do
      axiosMock.onPost().reply(async (config) => {
        const postedData = JSON.parse(config.data);
        const params: ExecParams = postedData.params;
        const safe = factory.attach(postedData.to);
        const tx = await safe.execTransaction(...params);
  
        return [200, { txHash: tx.hash }];
      });
      relayer = new GnosisBiconomy({
        apiKey: "testkey",
        apiId: "testid",
        userSigner: alice,
        chainId,
        targetChainProvider: deployer.provider!,
        httpClient: axios,
      });
      wrapped = wrapContract<Echo>(echo, relayer);
    })

    it('sends back to back transactions sent at the same time (queue test)', async () => {
      const value2 = utils.formatBytes32String("value2");
      const responses = await Promise.all([
        wrapped.setMapping(testKey, testValue),
        wrapped.setMapping(testKey, value2)
      ])
      await Promise.all(responses.map((tx) => tx.wait()))
      expect(await echo.publicMapping(testKey)).to.equal(value2);
    })
  
    it("sends the tx to biconomy", async () => {  
      const resp = await wrapped.setMapping(testKey, testValue);
      await resp.wait();
      expect(await echo.publicMapping(testKey)).to.equal(testValue);
    });
  })

  it('handles the new retry wrapper', async () => {
    const badHash = '0x832c6ab5ad1b41221437f3365872497c9bfb1573df861151a77beaf8e3be0000'
    await walletMaker.deployWallet(alice.address);

    const factory = new GnosisSafe__factory(deployer);

    let originalConfigData:any
    // mock out biconomy return a bad hash at first, but then a good hash
    axiosMock.onPost().reply(async (config) => {
      originalConfigData = config.data
      return [200, { txHash: badHash }];
    });
    axiosMock.onGet().reply(async (config) => {
      if (config.url?.includes('resubmitted')) {
        const postedData = JSON.parse(originalConfigData);
        const params: ExecParams = postedData.params;
        const safe = factory.attach(postedData.to);
        const tx = await safe.execTransaction(...params);
  
        return [200, { oldHash: badHash, newHash: tx.hash }];
      }
      throw new Error('unknown url')
    })
    const relayer = new GnosisBiconomy({
      apiKey: "testkey",
      apiId: "testid",
      userSigner: alice,
      chainId,
      targetChainProvider: deployer.provider!,
      httpClient: axios,
      options: {
        relayAttempts: 1,
      }
    });
    const wrapped = wrapContract<Echo>(echo, relayer);
    const resp = await wrapped.setMapping(testKey, testValue);
    await resp.wait();
    expect(await echo.publicMapping(testKey)).to.equal(testValue);
  })

  it('supports a pure value transfer', async () => {
    await walletMaker.deployWallet(alice.address);
    const value = utils.parseEther('2.2')

    const aliceSafeAddr = await walletMaker.walletAddressForUser(alice.address)
    const initialBalance = await alice.getBalance()

    await alice.sendTransaction({
        to: aliceSafeAddr,
        value,
    })

    const factory = new GnosisSafe__factory(deployer);

    // mock out biconomy to do the local relay and return a response similar to what they do
    axiosMock.onPost().reply(async (config) => {
      const postedData = JSON.parse(config.data);
      const params: ExecParams = postedData.params;

      const safe = factory.attach(postedData.to);
      const tx = await safe.execTransaction(...params);

      return [200, { txHash: tx.hash }];
    });

    const relayer = new GnosisBiconomy({
      apiKey: "testkey",
      apiId: "testid",
      userSigner: alice,
      chainId,
      targetChainProvider: deployer.provider!,
      httpClient: axios,
    });

    const populatedTx = await alice.populateTransaction({to: alice.address, value })
    const tx = await relayer.multisend([populatedTx as any])
    await tx.wait()
    expect(initialBalance.sub(await alice.getBalance()).toNumber()).to.be.lessThan(utils.parseEther('0.001').toNumber()) //just accounting for gas
  })

  it("accepts value on contract call", async () => {
    await walletMaker.deployWallet(alice.address);
    const value = utils.parseEther('2.2')

    await alice.sendTransaction({
        to: await walletMaker.walletAddressForUser(alice.address),
        value,
    })

    const factory = new GnosisSafe__factory(deployer);

    // mock out biconomy to do the local relay and return a response similar to what they do
    axiosMock.onPost().reply(async (config) => {
      const postedData = JSON.parse(config.data);
      const params: ExecParams = postedData.params;

      const safe = factory.attach(postedData.to);
      const tx = await safe.execTransaction(...params);

      return [200, { txHash: tx.hash }];
    });

    const relayer = new GnosisBiconomy({
      apiKey: "testkey",
      apiId: "testid",
      userSigner: alice,
      chainId,
      targetChainProvider: deployer.provider!,
      httpClient: axios,
    });

    const wrapped = wrapContract<Echo>(echo, relayer);

    const resp = await wrapped.setValueMapping(testKey, { value });
    await resp.wait();
    expect(await echo.publicMapping(testKey)).to.equal(value);
  });
});
