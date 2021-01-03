import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

export const signerFor = async (hre: HardhatRuntimeEnvironment, signerOrAddress: SignerWithAddress | string): Promise<SignerWithAddress> => {
  if (typeof (signerOrAddress as any).sendTransaction == "function") return signerOrAddress as SignerWithAddress

  const signer = (await hre.ethers.getSigners()).find((signer) => signer.address === signerOrAddress)
  if (!signer) throw new Error('non existant address' + signerOrAddress)
  return signer
}

export const deployerSigner = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts()
  return signerFor(hre, deployer)
}
