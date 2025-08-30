import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createClient, type SS58String } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { chainSpec } from "polkadot-api/chains/paseo";
import { dot } from "@polkadot-api/descriptors";

const smoldot = start();

const relayChain = smoldot.addChain({
  chainSpec,
});

const client = createClient(getSmProvider(relayChain));
const typedApi = client.getTypedApi(dot);

const res = await typedApi.query.System.Account.getValue(
  "5FxrUu1PUugUYs6HQ83bDswjGLyHYTEzm7yqmrkKVPaYe71Y"
);
console.log("my account", res);

typedApi.query.System.Events.watchValue().subscribe((events) => {
  console.log(events);
});

async function getSudoAccountFreeBalance(): Promise<{ balance: bigint; account: string }> {
  const sudoAccount = await client.getUnsafeApi().query.Sudo.Key.getValue();
  const accountInfo = await typedApi.query.System.Account.getValue(sudoAccount);
  return { balance: accountInfo.data.free, account: sudoAccount };
}

getSudoAccountFreeBalance().then((result) => {
  console.log("Account info:", result.account);

  console.log("Balance:", result.balance);
});

async function findAllProxyAccountsOfTypeAny(): Promise<Array<SS58String>> {
  const result = await typedApi.query.Proxy.Proxies.getEntries();
  return result.map(entry => entry.keyArgs[0]);
}

findAllProxyAccountsOfTypeAny().then(accounts => console.log("I was able to get these proxy accounts:", accounts));

async function findMaxProxyAccounts(): Promise<Array<SS58String>> {
  const maxDelegates = await typedApi.constants.Proxy.MaxProxies();
  const result = await typedApi.query.Proxy.Proxies.getEntries();
  return result.filter(entry => entry.value.length === maxDelegates).map(entry => entry.keyArgs[0]);
}

findMaxProxyAccounts().then(accounts => console.log("I was able to get these proxy accounts:", accounts));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
