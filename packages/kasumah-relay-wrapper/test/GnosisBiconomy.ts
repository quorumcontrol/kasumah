import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Echo } from "../types/ethers-contracts/Echo";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { wrapContract } from "../src";
import { GnosisBiconomy } from "../src/relayers";
import { WalletMaker, deployCanonicals } from "kasumah-wallet";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { ExecParams } from "../src/relayers/GnosisHelpers";
import { GnosisSafe__factory } from "kasumah-wallet/dist/types/ethers-contracts/factories/GnosisSafe__factory";

describe("GnosisBiconomy", () => {
  let chainId: number;
  let echo: Echo;
  let deployer: SignerWithAddress;
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

    const signers = await ethers.getSigners();
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
      const params: ExecParams = [...postedData.params, {gasLimit: 9500000}] as ExecParams;
      
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

  it("sends the tx to biconomy", async () => {
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

    const relayer = new GnosisBiconomy({
      apiKey: "testkey",
      apiId: "testid",
      userSigner: alice,
      chainId,
      targetChainProvider: deployer.provider!,
      httpClient: axios,
    });

    const wrapped = wrapContract<Echo>(echo, relayer);

    const resp = await wrapped.setMapping(testKey, testValue);
    await resp.wait();
    expect(await echo.publicMapping(testKey)).to.equal(testValue);
  });


  it("accepts value", async () => {
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
