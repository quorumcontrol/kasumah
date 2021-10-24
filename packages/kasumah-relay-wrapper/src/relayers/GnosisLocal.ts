import { OPERATION, WalletMaker } from "kasumah-wallet";
import { GnosisSafe__factory } from "kasumah-wallet/dist/types/ethers-contracts/factories/GnosisSafe__factory";
import { Signer, Contract, PopulatedTransaction, ContractTransaction, BigNumber } from "ethers";
import { Relayer } from "./types";
import { multisendTx, safeFromPopulated, safeTx, MULTI_SEND_ADDR } from './GnosisHelpers';
import debug from 'debug'
import { GnosisSafe } from "kasumah-wallet/dist/types/ethers-contracts";
import Queue from "queue-promise";

const log = debug('GnosisLocalRelayer')

interface GnosisLocalRelayerConstrutorArgs {
  userSigner: Signer; // used to sign the gasless txs
  transmitSigner: Signer; // signer used to actually ship to the blockchain
  chainId: number;
}

export class GnosisLocalRelayer implements Relayer {
  transmitSigner: Signer;
  userSigner: Signer; // the signer used to sign transactions
  walletMaker: WalletMaker;
  safeFactory: GnosisSafe__factory;
  private nonce:Promise<BigNumber>;
  private safe:Promise<GnosisSafe>;
  private userWalletAddr:Promise<string>;
  private queue:Queue;

  constructor({
    transmitSigner,
    userSigner,
    chainId,
  }: GnosisLocalRelayerConstrutorArgs) {
    this.queue = new Queue({
      concurrent: 1,
      interval: 1000
    });

    this.userSigner = userSigner;
    this.transmitSigner = transmitSigner;
    this.walletMaker = new WalletMaker({ signer: transmitSigner, chainId });
    this.safeFactory = new GnosisSafe__factory(transmitSigner);
    const userAddr = this.userSigner.getAddress();
    this.userWalletAddr = userAddr.then((userAddr) => {
       return this.walletMaker.walletAddressForUser(
        userAddr
      );
    })
    this.safe = this.userWalletAddr.then((userWalletAddr) => {
      return this.safeFactory.attach(userWalletAddr);
    })
    this.nonce = this.safe.then((safe) => safe.nonce())
  }

  async multisend(txs:PopulatedTransaction[]):Promise<ContractTransaction> {
    return new Promise(async (resolve,reject) => {
      this.queue.enqueue(async () => {
        try {
          const multiTx = await multisendTx(txs)
          const safe = await this.safe
          const userWalletAddr = await this.userWalletAddr
          const nonce = await this.nonce
          this.nonce = Promise.resolve(nonce.add(1))

          const [tx] = await safeFromPopulated(safe, nonce, this.userSigner, userWalletAddr, MULTI_SEND_ADDR, multiTx.data!, OPERATION.DELEGATE_CALL, { gasLimit: 9500000 })
          const data = await this.sendTx(safe, tx)
          resolve(data)
        } catch(err) {
          this.nonce = (await this.safe).nonce()
          reject(err)
        }
      })
    })

  }

  private async sendTx(safe:GnosisSafe, tx:PopulatedTransaction) {
    const respP = await this.transmitSigner.sendTransaction(tx)
    const origWait = respP.wait.bind(respP)
    respP.wait = async () => {
      const receipt = await origWait()
      const errorLog = safe.interface.parseLog(receipt.logs[receipt.logs.length - 1])
      if (errorLog.name !== "ExecutionSuccess") {
        console.error("error with transaction: ", errorLog)
        throw new Error([errorLog.name, errorLog.args.join(', ')].join(', '))
      }
      return receipt
    }
    return respP
  }

  async transmit(to: Contract, funcName: string, ...args: any):Promise<ContractTransaction> {
    return new Promise(async (resolve,reject) => {
      this.queue.enqueue(async () => {
        try {
          log("transmitting")
          const userWalletAddr = await this.userWalletAddr
          const safe = await this.safe
          log("wallet: ", userWalletAddr);
          const nonce = await this.nonce
          this.nonce = Promise.resolve(nonce.add(1))
          
            // TODO: explicitly see if the last argument has a 'value' and nothing else and it it does, allow merging it
          const lastArg = args.slice(-1)[0]
          let newArgs = args
          if (lastArg && lastArg.hasOwnProperty('value')) {
            lastArg.gasLimit = 9500000
            newArgs = args.slice(0,-1).concat([lastArg])
          } else {
            newArgs = [...args,{
              gasLimit: 9500000
            }]
          }
      
          const [tx] = await safeTx(safe, nonce, this.userSigner, userWalletAddr, to, funcName, ...newArgs)
      
          log('sending tx: ', tx)
          const data = await this.sendTx(safe, tx)
          resolve(data)
        } catch(err) {
          this.nonce = (await this.safe).nonce()
          reject(err)
        }
      })
    })
  }
}
