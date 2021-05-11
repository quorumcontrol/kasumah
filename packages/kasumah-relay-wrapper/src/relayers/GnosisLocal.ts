import { OPERATION, WalletMaker } from "kasumah-wallet";
import { GnosisSafe__factory } from "kasumah-wallet/dist/types/ethers-contracts/factories/GnosisSafe__factory";
import { Signer, Contract, PopulatedTransaction, ContractTransaction } from "ethers";
import { Relayer } from "./types";
import { multisendTx, safeFromPopulated, safeTx, MULTI_SEND_ADDR } from './GnosisHelpers';
import debug from 'debug'
import { GnosisSafe } from "kasumah-wallet/dist/types/ethers-contracts";

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

  constructor({
    transmitSigner,
    userSigner,
    chainId,
  }: GnosisLocalRelayerConstrutorArgs) {
    this.userSigner = userSigner;
    this.transmitSigner = transmitSigner;
    this.walletMaker = new WalletMaker({ signer: transmitSigner, chainId });
    this.safeFactory = new GnosisSafe__factory(transmitSigner);
  }

  async multisend(txs:PopulatedTransaction[]):Promise<ContractTransaction> {
    const multiTx = await multisendTx(txs)
    const userAddr = await this.userSigner.getAddress();

    const userWalletAddr = await this.walletMaker.walletAddressForUser(
      userAddr
    );

    const safe = this.safeFactory.attach(userWalletAddr);

    const [tx] = await safeFromPopulated(safe, this.userSigner, userWalletAddr, MULTI_SEND_ADDR, multiTx.data!, OPERATION.DELEGATE_CALL, { gasLimit: 9500000 })
    return this.sendTx(safe, tx)
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

  async transmit(to: Contract, funcName: string, ...args: any) {
    log("transmitting")
    const userAddr = await this.userSigner.getAddress();

    const userWalletAddr = await this.walletMaker.walletAddressForUser(
      userAddr
    );
    const safe = this.safeFactory.attach(userWalletAddr);
    log("userAddr: ", userAddr, " wallet: ", userWalletAddr);

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

    const [tx] = await safeTx(safe, this.userSigner, userWalletAddr, to, funcName, ...newArgs)

    log('sending tx: ', tx)
    return this.sendTx(safe, tx)
  }
}
