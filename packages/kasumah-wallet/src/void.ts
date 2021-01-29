import { constants, Signer, utils, VoidSigner } from "ethers"
import { GnosisSafe__factory } from "../types/ethers-contracts"

export const addr0 = constants.AddressZero

export const voidSigner = new VoidSigner(addr0)
