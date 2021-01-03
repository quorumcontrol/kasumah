"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const src_1 = require("../src");
const ethers_multicall_1 = require("ethers-multicall");
describe("MulticallWrapper", () => {
    let multicall;
    let chainId;
    let echo;
    beforeEach(async () => {
        chainId = hardhat_1.network.config.chainId;
        const MulticallFactory = await hardhat_1.ethers.getContractFactory("Multicall");
        multicall = (await MulticallFactory.deploy());
        await multicall.deployed();
        src_1.MulticallWrapper.setMulticallAddress(chainId, multicall.address);
        const EchoFactory = await hardhat_1.ethers.getContractFactory("Echo");
        echo = (await EchoFactory.deploy());
        await echo.deployed();
    });
    it("sanity works", async () => {
        const ethcallProvider = new ethers_multicall_1.Provider(hardhat_1.ethers.provider, chainId);
        const wrap = new ethers_multicall_1.Contract(echo.address, echo.interface.fragments);
        const resp = await ethcallProvider.all([wrap.echo("hi")]);
        chai_1.expect(resp[0]).to.equal("hi");
    });
    it("wraps", async () => {
        const wrapper = new src_1.MulticallWrapper(hardhat_1.ethers.provider, chainId);
        const wrappedEcho = await wrapper.wrap(echo);
        chai_1.expect(await wrappedEcho.echo("hi")).to.equal("hi");
    });
});
