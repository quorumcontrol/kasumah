import { ethers, network } from "hardhat";
import { expect } from "chai";
import { deployCanonicals } from "../src/helpers/deploy";
import { GnosisSafe__factory } from "../types/ethers-contracts";
import { GnosisSafe } from '../types/ethers-contracts/GnosisSafe'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const addr0 = ethers.constants.AddressZero

describe("MulticallWrapper", () => {
  let gnosisSafe:GnosisSafe
  let deployer:SignerWithAddress

  before(async () => {
    const signers = await ethers.getSigners()
    deployer = signers[0]
    await deployCanonicals(ethers.provider, deployer)
    const gsf = new GnosisSafe__factory(deployer)
    // const gs = new GnosisSafe('0x6851D6fDFAfD08c0295C392436245E5bc78B0185', gsf.interface, deployer)
    gnosisSafe = gsf.attach('0x6851D6fDFAfD08c0295C392436245E5bc78B0185')
  });

  it("sanity works", async () => {


    console.log(await gnosisSafe.populateTransaction.setup([deployer.address], 1, addr0, '0x', addr0, addr0, 0, addr0))
  });

});
