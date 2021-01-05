import { utils } from "ethers"

export type Address = string

export function calcCreate2Address(deployer: Address, salt: string, initCode: string): string {
    return utils.getAddress(
      utils
        .solidityKeccak256(
          ['bytes', 'address', 'bytes32', 'bytes32'],
          ['0xff', deployer, salt, utils.keccak256(initCode)]
        )
        .slice(-40)
    )
  }