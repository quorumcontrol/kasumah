import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Multicall } from "../types/ethers-contracts/Multicall";
import { Echo } from "../types/ethers-contracts/Echo";
import { MulticallWrapper } from "../src";
import { Contract, Provider } from "ethers-multicall";
import { utils } from "ethers";

describe("MulticallWrapper", () => {
  let multicall: Multicall;
  let chainId: number;
  let echo: Echo;

  beforeEach(async () => {
    chainId = network.config.chainId!;

    const MulticallFactory = await ethers.getContractFactory("Multicall");
    multicall = (await MulticallFactory.deploy()) as Multicall;
    await multicall.deployed();
    MulticallWrapper.setMulticallAddress(chainId, multicall.address);

    const EchoFactory = await ethers.getContractFactory("Echo");
    echo = (await EchoFactory.deploy()) as Echo;
    await echo.deployed();
  });

  it("sanity works", async () => {
    const ethcallProvider = new Provider(ethers.provider, chainId);
    const wrap = new Contract(echo.address, echo.interface.fragments as any);

    const resp = await ethcallProvider.all([wrap.echo("hi")]);
    expect(resp[0]).to.equal("hi");
  });

  it("wraps", async () => {
    const wrapper = new MulticallWrapper(ethers.provider, chainId);
    const wrappedEcho = await wrapper.wrap<Echo>(echo);
    expect(await wrappedEcho.echo("hi")).to.equal("hi");
  });

  it("supports options", async () => {
    const wrapper = new MulticallWrapper(ethers.provider, chainId, { cache: true, batchScheduleFn: (cb) => setTimeout(cb, 100)});
    const wrappedEcho = await wrapper.wrap<Echo>(echo);
    expect(await wrappedEcho.echo("hi")).to.equal("hi");
  });

  it('supports subscriptions after wrapping', async () => {
    const wrapper = new MulticallWrapper(ethers.provider, chainId);
    const wrappedEcho = await wrapper.wrap<Echo>(echo);
    return new Promise((resolve) => {
      wrappedEcho.on(wrappedEcho.filters.Echoed(utils.formatBytes32String('hi')), ()=> { resolve() })
      wrappedEcho.setMapping(utils.formatBytes32String('hi'))
    })
  })
});
