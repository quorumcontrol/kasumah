import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  const { deploy } = hre.deployments
  const { deployer } = await hre.getNamedAccounts()

  await deploy('KasumahOwnerConfigs', {
    from: deployer,
    log: true,
  })

  await deploy('Kasumah721OwnerConfigs', {
    from: deployer,
    log: true,
  })

}

export default func
