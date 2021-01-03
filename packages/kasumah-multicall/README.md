# Kasumah Multicall

Kasumah Multicall makes it easier to work with Multicall ( https://github.com/makerdao/multicall ).

Kasumah Multicall wraps https://www.npmjs.com/package/ethers-multicall to make it transparent when using contracts, drastically simplifying use (making it transparent).

Behind the scenes it uses https://github.com/graphql/dataloader (without cacheing) inorder to queue up view calls and batch them up into a single RPC call.

## Usage

Create a singleton instance of [MulticallWrapper](src/index.ts):

```typescript
const wrapper = new MulticallWrapper(ethers.provider, chainId);
```

After that you can wrap your ethers contracts with that wrapper.

```typescript
const wrappedEcho = await wrapper.wrap<Echo>(echo);
```

From there you can just call your contracts as normal:

```typescript
await wrappedEcho.echo("hi"); // will return 'hi'
```

A full example. Extracted from the [tests](test/MulticallWrapper.ts).

```typescript
const infuraKey = "INSERT_YOUR_KEY_HERE";
const provider = new ethers.providers.InfuraProvider("mainnet", infuraKey);

// create the wrapper:
const wrapper = new MulticallWrapper(ethers.provider, 1); // chainId of 1 for 'mainnet'

const EchoFactory = await ethers.getContractFactory("Echo");
echo = (await EchoFactory.deploy()) as Echo;
await echo.deployed();

const wrappedEcho = await wrapper.wrap<Echo>(echo);
console.log(await wrappedEcho.echo("hi"));
```
