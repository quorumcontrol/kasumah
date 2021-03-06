/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface KasumahUintLoggerInterface extends ethers.utils.Interface {
  functions: {
    "add(address,string,uint256)": FunctionFragment;
    "all(address,string)": FunctionFragment;
    "length(address,string)": FunctionFragment;
    "remove(address,string,uint256)": FunctionFragment;
    "setApproved(address,bool)": FunctionFragment;
    "slice(address,string,uint256,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "add",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "all", values: [string, string]): string;
  encodeFunctionData(
    functionFragment: "length",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "remove",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setApproved",
    values: [string, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "slice",
    values: [string, string, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "add", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "all", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "length", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "remove", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setApproved",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "slice", data: BytesLike): Result;

  events: {};
}

export class KasumahUintLogger extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: KasumahUintLoggerInterface;

  functions: {
    add(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    all(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber[]] & { ids: BigNumber[] }>;

    length(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    remove(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setApproved(
      user: string,
      isApproved: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    slice(
      user: string,
      key: string,
      start: BigNumberish,
      len: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber[]] & { ids: BigNumber[] }>;
  };

  add(
    user: string,
    key: string,
    id: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  all(
    user: string,
    key: string,
    overrides?: CallOverrides
  ): Promise<BigNumber[]>;

  length(
    user: string,
    key: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  remove(
    user: string,
    key: string,
    id: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setApproved(
    user: string,
    isApproved: boolean,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  slice(
    user: string,
    key: string,
    start: BigNumberish,
    len: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber[]>;

  callStatic: {
    add(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    all(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<BigNumber[]>;

    length(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    remove(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setApproved(
      user: string,
      isApproved: boolean,
      overrides?: CallOverrides
    ): Promise<void>;

    slice(
      user: string,
      key: string,
      start: BigNumberish,
      len: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber[]>;
  };

  filters: {};

  estimateGas: {
    add(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    all(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    length(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    remove(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setApproved(
      user: string,
      isApproved: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    slice(
      user: string,
      key: string,
      start: BigNumberish,
      len: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    add(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    all(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    length(
      user: string,
      key: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    remove(
      user: string,
      key: string,
      id: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setApproved(
      user: string,
      isApproved: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    slice(
      user: string,
      key: string,
      start: BigNumberish,
      len: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
