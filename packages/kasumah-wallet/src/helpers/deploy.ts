import { BigNumber, utils, providers, Signer } from "ethers";
import safe111AndFactoryConfig from "./txs/0_safe111AndFactoryConfig.json"
import safe120Config from "./txs/1_safe120Config.json"

// see: https://etherscan.io/address/0x1aa7451dd11b8cb16ac089ed7fe05efa00100a6a
import tx2 from './txs/2_setImplementation.json'
import tx3 from './txs/3_multisend.json'
import tx4 from './txs/4_setImpl.json'
import tx5 from './txs/5_createAndAddModules.json'
import tx6 from './txs/6_setImpl.json'
import tx7 from './txs/7_createCall.json'
import tx8 from './txs/8_seImpl.json'
import tx9 from './txs/9_defaultHandlerConfig.json'
import tx10 from './txs/10_setImpl.json'

import debug from 'debug'

const log = debug("CANONICAL_DEPLOY")

interface SavedTx {
  deploymentTx: string
  deploymentCosts: string
  deployer: string,
  nonce: number
}

const DEPLOYER_ADDR = '0x1aa7451dd11b8cb16ac089ed7fe05efa00100a6a'

export async function isCanonicalDeployed(provider: providers.Provider) {
  try {
    await checkCode(provider, safe120Config.safeAddress, safe120Config.runtimeCode)
  } catch (e) {
    if (e.message.includes('NotExpectedError')) {
      return false
    }
    throw e
  }

  const txCount = await provider.getTransactionCount(DEPLOYER_ADDR)
  if (txCount < 11) {
    return false
  }

  return true
}

export async function deployCanonicals(signer: Signer) {
  const funder = signer
  const provider = signer.provider
  if (!provider) {
    throw new Error("provider is undefined")
  }

  const isExpectedNonce = async (expected:number) => {
    const nonce = await provider.getTransactionCount(DEPLOYER_ADDR)
    if (nonce === expected) {
      return true
    }
    log(`expected nonce ${expected} but was ${nonce}`)
    return false
  }

  const deploy111AndFactory = async () => {
    const nonce = await provider.getTransactionCount(safe111AndFactoryConfig.deployer)
    if (nonce != 0) {
      console.warn("Deployment account has been used on this network")
      return
    }
    const deploymentCosts111AndFactory = BigNumber.from(safe111AndFactoryConfig.deploymentCosts)
    const deploymentAccountBalance = await provider.getBalance(safe111AndFactoryConfig.deployer)
    if (deploymentAccountBalance.lt(deploymentCosts111AndFactory)) {
      const tx = await funder.sendTransaction({
        to: safe111AndFactoryConfig.deployer,
        value: deploymentCosts111AndFactory.sub(deploymentAccountBalance)
      })
      await tx.wait()
    }
    log("------ Deploy Safe 1.1.1 ------")
    await waitForTx(provider, safe111AndFactoryConfig.deploymentTx)
    await checkCode(provider, safe111AndFactoryConfig.safeAddress, safe111AndFactoryConfig.runtimeCode)
    log("------ Execute Config Tx ------")
    await waitForTx(provider, safe111AndFactoryConfig.configTx)
    log("------ Deploy Factory ------")
    await waitForTx(provider, safe111AndFactoryConfig.factoryDeploymentTx)
    await checkCode(provider, safe111AndFactoryConfig.factoryAddress, safe111AndFactoryConfig.factoryRuntimeCode)
  }
  
  const deploy120 = async () => {
    log('deploy 1.2')
    if (!(await isExpectedNonce(3))) {
      return
    }
    const deploymentCosts120 = BigNumber.from(safe120Config.deploymentCosts)
    const deploymentAccountBalance = await provider.getBalance(safe120Config.deployer)
    log('price: ', utils.formatEther(deploymentCosts120.sub(deploymentAccountBalance)))
    if (deploymentAccountBalance.lt(deploymentCosts120)) {
      const tx = await funder.sendTransaction({
        to: safe120Config.deployer,
        value: deploymentCosts120.sub(deploymentAccountBalance)
      })
      await tx.wait()
    }
    log("------ Deploy Safe 1.2.0 ------")
    await waitForTx(provider, safe120Config.deploymentTx)
    await checkCode(provider, safe120Config.safeAddress, safe120Config.runtimeCode)
  }

  const deployTx = async (txConfig:SavedTx) => {
    if (!(await isExpectedNonce(txConfig.nonce))) {
      log('skipping')
      return
    }
    const deploymentCostsDefaultHandler = BigNumber.from(txConfig.deploymentCosts)
    const deploymentAccountBalance = await provider.getBalance(txConfig.deployer)
    if (deploymentAccountBalance.lt(deploymentCostsDefaultHandler)) {
      const tx = await funder.sendTransaction({
        to: txConfig.deployer,
        value: deploymentCostsDefaultHandler.sub(deploymentAccountBalance)
      })
      await tx.wait()
    }
    log("------ deploy ------")
    await waitForTx(provider, txConfig.deploymentTx)
  }

  const chain = async (configs:SavedTx[]) => {
    log('deploying 2')
    let last = deployTx(configs[0])
    for (let i = 1; i < configs.length; i++) {
      last = last.then(()=> {
        log(`deploying ${i + 2}`)
        return deployTx(configs[i])
      })
    }
    return last
  }

  
  return deploy111AndFactory()
    .then(deploy120).then(()=> {
      return chain([
      tx2, tx3,tx4,tx5,tx6, tx7,tx8,tx9,tx10
      ])
    })
}

const waitForTx = async (provider:providers.Provider, singedTx:string): Promise<providers.TransactionReceipt> => {
  const tx = await provider.sendTransaction(singedTx);
  return await tx.wait()
}

const checkCode = async (provider:providers.Provider, address:string, expectedCode:string): Promise<void> => {
  const code = await provider.getCode(address)
  if (code !== expectedCode) {
    throw new Error(`NotExpectedError: ${expectedCode} != ${code}`)
  }
  log(`Deployment ${code === expectedCode ? "was successful" : "has failed"}`)
}
