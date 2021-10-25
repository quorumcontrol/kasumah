import { OPERATION, WalletMaker } from "kasumah-wallet";
import { GnosisSafe__factory } from "kasumah-wallet/dist/types/ethers-contracts/factories/GnosisSafe__factory";
import {
  BigNumber,
  Signer,
  Contract,
  VoidSigner,
  constants,
  providers,
  PopulatedTransaction,
  ContractTransaction,
} from "ethers";
import { Relayer } from "./types";
import {
  multisendTx,
  MULTI_SEND_ADDR,
  safeFromPopulated,
  safeTx,
} from "./GnosisHelpers";
import { GnosisSafe } from "kasumah-wallet/dist/types/ethers-contracts/GnosisSafe";
import axios, { AxiosStatic } from "axios";
import debug from "debug";
import { backOff } from "exponential-backoff";
import Queue from "queue-promise";

const log = debug("GnosisBiconomy");

interface GnosisBiconomyRelayerOptions {
  relayAttempts: number;
}

const defaultOptions: GnosisBiconomyRelayerOptions = {
  relayAttempts: 20,
};

interface GnosisBiconomyRelayerConstrutorArgs {
  userSigner: Signer; // used to sign the gasless txs
  targetChainProvider: providers.Provider;
  chainId: number;
  apiKey: string;
  apiId: string;
  httpClient?: AxiosStatic;
  options?: GnosisBiconomyRelayerOptions;
}

export class GnosisBiconomy implements Relayer {
  userSigner: Signer; // the signer used to sign transactions
  walletMaker: WalletMaker;
  safeFactory: GnosisSafe__factory;
  targetChainProvider: providers.Provider;

  apiId: string;
  apiKey: string;

  private voidSigner: VoidSigner;
  private successTopic: string;
  private httpClient: AxiosStatic;
  private options: GnosisBiconomyRelayerOptions;
  private nonce: Promise<BigNumber>;
  private safe: Promise<GnosisSafe>;
  private userWalletAddr: Promise<string>;
  private queue: Queue;

  constructor({
    userSigner,
    chainId,
    apiKey,
    apiId,
    targetChainProvider,
    httpClient,
    options,
  }: GnosisBiconomyRelayerConstrutorArgs) {
    this.queue = new Queue({
      concurrent: 1,
      interval: 1000,
    });

    this.userSigner = userSigner;
    this.voidSigner = new VoidSigner(
      constants.AddressZero,
      targetChainProvider
    );
    this.walletMaker = new WalletMaker({ signer: this.voidSigner, chainId });
    this.safeFactory = new GnosisSafe__factory(this.voidSigner);
    this.targetChainProvider = targetChainProvider;
    this.apiId = apiId;
    this.apiKey = apiKey;
    this.options = { ...defaultOptions, ...(options || {}) };

    const voidSafe = this.safeFactory.attach(constants.AddressZero);
    this.successTopic = voidSafe.interface.getEventTopic(
      "ExecutionSuccess(bytes32,uint256)"
    );
    this.userWalletAddr = this.userSigner.getAddress().then((userAddr) => {
      return this.walletMaker.walletAddressForUser(userAddr);
    });
    this.safe = this.userWalletAddr.then((userWalletAddr) => {
      return this.safeFactory.attach(userWalletAddr);
    });
    this.nonce = this.safe.then((safe) => safe.nonce());

    // useful for testing
    if (httpClient) {
      log("using user-supplied http client");
      this.httpClient = httpClient;
    } else {
      this.httpClient = axios;
    }
  }

  async multisend(txs: PopulatedTransaction[]): Promise<ContractTransaction> {
    return new Promise(async (resolve, reject) => {
      this.queue.enqueue(async () => {
        try {
          const multiTx = await multisendTx(txs);
          const userAddr = await this.userSigner.getAddress();
          const userWalletAddr = await this.userWalletAddr;
          const nonce = await this.nonce;
          this.nonce = Promise.resolve(nonce.add(1));
          const [_, execArgs] = await safeFromPopulated(
            await this.safe,
            nonce,
            this.userSigner,
            userWalletAddr,
            MULTI_SEND_ADDR,
            multiTx.data!,
            OPERATION.DELEGATE_CALL
          );
          const resp = await this.sendSignedTransaction(
            userWalletAddr,
            userAddr,
            execArgs
          );
          resp.wait().then(() => {
            resolve(resp)
          }).catch((err) => {
            reject(err)
          })
        } catch (err) {
          this.nonce = (await this.safe).nonce();
          reject(err);
        }
      });
    });
  }

  async transmit(
    to: Contract,
    funcName: string,
    ...args: any
  ): Promise<ContractTransaction> {
    return new Promise(async (resolve, reject) => {
      this.queue.enqueue(async () => {
        try {
          const userAddr = await this.userSigner.getAddress();
          const userWalletAddr = await this.userWalletAddr;
          const safe = await this.safe;
          const nonce = await this.nonce;
          this.nonce = Promise.resolve(nonce.add(1));
          log(
            "transmit: userAddr: ",
            userAddr,
            " wallet: ",
            userWalletAddr,
            " nonce: ",
            nonce.toString()
          );

          const [, execArgs] = await safeTx(
            safe,
            nonce,
            this.userSigner,
            userWalletAddr,
            to,
            funcName,
            ...args
          );
          const resp = await this.sendSignedTransaction(
            userWalletAddr,
            userAddr,
            execArgs
          );
          resp.wait().then(() => {
            resolve(resp)
          }).catch((err) => {
            reject(err)
          })
        } catch (err) {
          this.nonce = (await this.safe).nonce();
          reject(err);
        }
      });
    });
  }

  private async txFromHash(txHash: string) {
    try {
      const tx = await backOff(
        async () => {
          const tx = await this.voidSigner.provider?.getTransaction(txHash);
          if (!tx) {
            throw new Error(`missing tx (${txHash}) - inside backoff`);
          }
          log("returning tx: ", tx);
          return tx;
        },
        {
          numOfAttempts: this.options.relayAttempts,
          retry: (e, attempts) => {
            console.dir(e);
            console.error(
              `error fetching Tx (${txHash}), retrying. attempt: ${attempts}`
            );
            return true;
          },
          startingDelay: 2000,
          maxDelay: 15000, // max 10s delays
        }
      );
      if (!tx) {
        throw new Error("missing tx - outside backoff");
      }

      const successTopic = this.successTopic;

      const origWait = tx.wait.bind(tx);
      tx.wait = async () => {
        const receipt = await origWait();
        const lastTwoLogs = receipt.logs.slice(-2); // on the mainnet there's a LogFeeTransfer event that's last, but not locally
        const success = lastTwoLogs.find((l) => l.topics[0] === successTopic);
        if (!success) {
          console.error("error with transaction: ", receipt);
          throw new Error(`Error with transaction ${receipt.transactionHash}`);
        }
        return receipt;
      };
      return tx;
    } catch (error) {
      console.error("error fetching tx: ", error);
      throw error;
    }
  }

  private async sendSignedTransaction(
    walletAddress: string,
    userAddress: string,
    execArgs: Parameters<GnosisSafe["execTransaction"]>
  ) {
    log("transmitting to biconomy");
    try {
      const resp = await backOff(
        () => {
          return this.httpClient.post(
            "https://api.biconomy.io/api/v2/meta-tx/native",
            {
              to: walletAddress,
              apiId: this.apiId,
              params: execArgs,
              from: userAddress,
              gasLimit: 9500000,
            },
            {
              headers: {
                "x-api-key": this.apiKey,
              },
            }
          );
        },
        {
          numOfAttempts: this.options.relayAttempts,
          retry: (e, attempts) => {
            console.dir(e);
            console.error(
              `error submitting Tx to biconomy, retrying. attempt: ${attempts}`
            );
            return true;
          },
          startingDelay: 700,
          maxDelay: 5000,
        }
      );
      log("resp: ", resp);
      return this.txFromHash(resp.data.txHash);
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(error.response.data);
        console.error(error.response.status);
        console.error(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error", error.message);
      }
      throw error;
    }
  }
}
