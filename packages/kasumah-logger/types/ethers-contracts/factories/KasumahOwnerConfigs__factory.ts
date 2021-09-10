/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  KasumahOwnerConfigs,
  KasumahOwnerConfigsInterface,
} from "../KasumahOwnerConfigs";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "erc1155Contract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenID",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "key",
        type: "string",
      },
    ],
    name: "latest",
    outputs: [
      {
        internalType: "bytes",
        name: "value",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "erc1155Contract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenID",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        internalType: "bytes",
        name: "value",
        type: "bytes",
      },
    ],
    name: "set",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "erc1155Contract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenID",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "length",
        type: "uint256",
      },
    ],
    name: "snapshotSlice",
    outputs: [
      {
        internalType: "uint256[]",
        name: "blockNumbers",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "erc1155Contract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenID",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "valueAt",
    outputs: [
      {
        internalType: "bytes",
        name: "value",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610cd0806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806323ca2d1e1461005157806373f16da6146100665780637a967f6d1461008f578063ee4aaade146100af575b600080fd5b61006461005f36600461098e565b6100c2565b005b610079610074366004610a15565b6101d1565b6040516100869190610b6e565b60405180910390f35b6100a261009d366004610a75565b61050c565b6040516100869190610b2a565b6100796100bd366004610936565b6105b7565b6100cc86866105c6565b60006100da878787876106c2565b6000818152602081905260409020805491925043911580610133575080548290829061010890600190610bed565b8154811061012657634e487b7160e01b600052603260045260246000fd5b9060005260206000200154105b61018f5760405162461bcd60e51b815260206004820152602260248201527f4b65792063616e206f6e6c7920626520736574206f6e63652070657220626c6f604482015261636b60f01b60648201526084015b60405180910390fd5b805460018181018355600083815260208082209093018590558581529082526040808220858352909252206101c590868661083a565b50505050505050505050565b606060006101e1878787876106c2565b6000818152602081905260408120919250906101fd90856106fb565b6000838152602081905260409020909150816102f5576001600084815260200190815260200160002060008260008154811061024957634e487b7160e01b600052603260045260246000fd5b90600052602060002001548152602001908152602001600020805461026d90610c04565b80601f016020809104026020016040519081016040528092919081815260200182805461029990610c04565b80156102e65780601f106102bb576101008083540402835291602001916102e6565b820191906000526020600020905b8154815290600101906020018083116102c957829003601f168201915b50505050509350505050610503565b805482141561033a57600083815260016020819052604082209190839061031c9086610bed565b8154811061024957634e487b7160e01b600052603260045260246000fd5b600081838154811061035c57634e487b7160e01b600052603260045260246000fd5b906000526020600020015490508581111561045a57600084815260016020819052604082209190849061038f9087610bed565b815481106103ad57634e487b7160e01b600052603260045260246000fd5b9060005260206000200154815260200190815260200160002080546103d190610c04565b80601f01602080910402602001604051908101604052809291908181526020018280546103fd90610c04565b801561044a5780601f1061041f5761010080835404028352916020019161044a565b820191906000526020600020905b81548152906001019060200180831161042d57829003601f168201915b5050505050945050505050610503565b60008481526001602090815260408083208484529091529020805461047e90610c04565b80601f01602080910402602001604051908101604052809291908181526020018280546104aa90610c04565b80156104f75780601f106104cc576101008083540402835291602001916104f7565b820191906000526020600020905b8154815290600101906020018083116104da57829003601f168201915b50505050509450505050505b95945050505050565b6060600080600061051f8a8a8a8a6106c2565b8152602001908152602001600020905060005b838110156105ab57816105458683610bc1565b8154811061056357634e487b7160e01b600052603260045260246000fd5b906000526020600020015483828151811061058e57634e487b7160e01b600052603260045260246000fd5b6020908102919091010152806105a381610c3f565b915050610532565b50509695505050505050565b606061050385858585436101d1565b8160016001600160a01b03821662fdd58e336040516001600160e01b031960e084901b1681526001600160a01b0390911660048201526024810186905260440160206040518083038186803b15801561061e57600080fd5b505afa158015610632573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106569190610adf565b10156106bd5760405162461bcd60e51b815260206004820152603060248201527f4b6173756d61684f776e6572436f6e66696773234f6e7920616e206f776e657260448201526f206d61792073657420636f6e6669677360801b6064820152608401610186565b505050565b6000848484846040516020016106db9493929190610af7565b604051602081830303815290604052805190602001209050949350505050565b815460009061070c575060006107d6565b82546000905b8082101561077657600061072683836107dc565b90508486828154811061074957634e487b7160e01b600052603260045260246000fd5b9060005260206000200154111561076257809150610770565b61076d816001610bc1565b92505b50610712565b6000821180156107b95750838561078e600185610bed565b815481106107ac57634e487b7160e01b600052603260045260246000fd5b9060005260206000200154145b156107d2576107c9600183610bed565b925050506107d6565b5090505b92915050565b600060026107ea8184610c5a565b6107f5600286610c5a565b6107ff9190610bc1565b6108099190610bd9565b610814600284610bd9565b61081f600286610bd9565b6108299190610bc1565b6108339190610bc1565b9392505050565b82805461084690610c04565b90600052602060002090601f01602090048101928261086857600085556108ae565b82601f106108815782800160ff198235161785556108ae565b828001600101855582156108ae579182015b828111156108ae578235825591602001919060010190610893565b506108ba9291506108be565b5090565b5b808211156108ba57600081556001016108bf565b80356001600160a01b03811681146108ea57600080fd5b919050565b60008083601f840112610900578182fd5b50813567ffffffffffffffff811115610917578182fd5b60208301915083602082850101111561092f57600080fd5b9250929050565b6000806000806060858703121561094b578384fd5b610954856108d3565b935060208501359250604085013567ffffffffffffffff811115610976578283fd5b610982878288016108ef565b95989497509550505050565b600080600080600080608087890312156109a6578182fd5b6109af876108d3565b955060208701359450604087013567ffffffffffffffff808211156109d2578384fd5b6109de8a838b016108ef565b909650945060608901359150808211156109f6578384fd5b50610a0389828a016108ef565b979a9699509497509295939492505050565b600080600080600060808688031215610a2c578081fd5b610a35866108d3565b945060208601359350604086013567ffffffffffffffff811115610a57578182fd5b610a63888289016108ef565b96999598509660600135949350505050565b60008060008060008060a08789031215610a8d578182fd5b610a96876108d3565b955060208701359450604087013567ffffffffffffffff811115610ab8578283fd5b610ac489828a016108ef565b979a9699509760608101359660809091013595509350505050565b600060208284031215610af0578081fd5b5051919050565b6bffffffffffffffffffffffff198560601b16815283601482015281836034830137600091016034019081529392505050565b6020808252825182820181905260009190848201906040850190845b81811015610b6257835183529284019291840191600101610b46565b50909695505050505050565b6000602080835283518082850152825b81811015610b9a57858101830151858201604001528201610b7e565b81811115610bab5783604083870101525b50601f01601f1916929092016040019392505050565b60008219821115610bd457610bd4610c6e565b500190565b600082610be857610be8610c84565b500490565b600082821015610bff57610bff610c6e565b500390565b600181811c90821680610c1857607f821691505b60208210811415610c3957634e487b7160e01b600052602260045260246000fd5b50919050565b6000600019821415610c5357610c53610c6e565b5060010190565b600082610c6957610c69610c84565b500690565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052601260045260246000fdfea26469706673582212202aac6469e99ed65224fd8150e1ce5b93e4e750d9fbc2ad066b315c5566eb2b2c64736f6c63430008040033";

export class KasumahOwnerConfigs__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<KasumahOwnerConfigs> {
    return super.deploy(overrides || {}) as Promise<KasumahOwnerConfigs>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): KasumahOwnerConfigs {
    return super.attach(address) as KasumahOwnerConfigs;
  }
  connect(signer: Signer): KasumahOwnerConfigs__factory {
    return super.connect(signer) as KasumahOwnerConfigs__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): KasumahOwnerConfigsInterface {
    return new utils.Interface(_abi) as KasumahOwnerConfigsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): KasumahOwnerConfigs {
    return new Contract(address, _abi, signerOrProvider) as KasumahOwnerConfigs;
  }
}