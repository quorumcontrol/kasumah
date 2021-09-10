import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "chai";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  KasumahOwnerConfigs,
  KasumahOwnerConfigs__factory,
  ERC721PresetMinterPauserAutoId,
  ERC721PresetMinterPauserAutoId__factory
} from "../types/ethers-contracts";

function advanceBlock() {
  return ethers.provider.send("evm_mine", []);
}

function bufferFromRet(ret: string) {
  return Buffer.from(ret.slice(2), "hex");
}

describe("Kasumah721OwnerConfigs", () => {
  let ownerConfigs: KasumahOwnerConfigs;
  let erc721One: ERC721PresetMinterPauserAutoId
  let erc721Two: ERC721PresetMinterPauserAutoId
  let signers: SignerWithAddress[];
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  beforeEach(async () => {
    signers = await ethers.getSigners();
    alice = signers[0];
    bob = signers[1];
    const configsFactory = (await ethers.getContractFactory(
      "Kasumah721OwnerConfigs"
    )) as KasumahOwnerConfigs__factory;
    ownerConfigs = await configsFactory.deploy();
    await ownerConfigs.deployed();

    erc721One = await new ERC721PresetMinterPauserAutoId__factory(signers[0]).deploy('721','721', '')
    erc721Two = await new ERC721PresetMinterPauserAutoId__factory(signers[0]).deploy('721','721', '')

  });

  it("sets when sender is owner", async () => {
    const key = "bob";
    const value = Buffer.from("bob");

    await erc721One.mint(bob.address)

    await ownerConfigs.connect(bob).set(erc721One.address, 0, key, value);
    expect(
      bufferFromRet(await ownerConfigs.connect(bob).latest(erc721One.address, 0, key)).toString()
    ).to.equal(value.toString());
  });

  it("denies when sender is unauthorized", async () => {
    const bob = signers[1];
    const key = "bob";
    const value = Buffer.from("bob");

    await erc721One.mint(bob.address)

    await expect(ownerConfigs.connect(alice).set(erc721One.address, 0, key, value)).to.be.reverted;
    await expect(ownerConfigs.connect(bob).set(erc721Two.address, 0, key, value)).to.be.reverted;
  });

  it("stores all values", async () => {
    const key = "bob";
    const value1 = Buffer.from("bob1");
    const value2 = Buffer.from("bob2");

    await erc721One.mint(alice.address)
    const current = await ethers.provider.getBlockNumber();

    await ownerConfigs.connect(alice).set(erc721One.address, 0, key, value1);
    await advanceBlock()
    await advanceBlock()
    await advanceBlock()
    const tx = await ownerConfigs.connect(alice).set(erc721One.address, 0, key, value2);
    await tx.wait()
    
    const initialSet = bufferFromRet(
      await ownerConfigs.valueAt(erc721One.address, 0, key, current + 1)
    );
    const valueBetweenSets = bufferFromRet(
      await ownerConfigs.valueAt(erc721One.address, 0, key, current + 3)
    );
    const latestSet = bufferFromRet(
      await ownerConfigs.valueAt(erc721One.address, 0, key, current + 5)
    );
    await advanceBlock()

    const latest = bufferFromRet(await ownerConfigs.latest(erc721One.address, 0, key));

    expect(valueBetweenSets.toString()).to.equal(initialSet.toString());
    expect(initialSet.toString()).to.equal(value1.toString());
    expect(latestSet.toString()).to.equal(value2.toString());
    expect(latestSet.toString()).to.equal(latest.toString());
  });
});
