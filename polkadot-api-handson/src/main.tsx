// import { pas,dot } from "@polkadot-api/descriptors";
// import { createClient } from "polkadot-api";
// import { chainSpec } from "polkadot-api/chains/polkadot";
// import { getSmProvider } from "polkadot-api/sm-provider";
// import type { JsonRpcProvider } from "polkadot-api/ws-provider/web";
// import { start } from "polkadot-api/smoldot";
// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";

// const smoldot = start();
// const chain = smoldot.addChain({
//   chainSpec,
// });

// const smoldotProvider = getSmProvider(chain);

// const provider: JsonRpcProvider = (onMsg) => {
//   const smoldotConnection = smoldotProvider((msg) => {
//     console.log(JSON.parse(msg));
//     onMsg(msg);
//   });

//   return {
//     send(message) {
//       console.log(JSON.parse(message));
//       smoldotConnection.send(message);
//     },
//     disconnect() {
//       smoldotConnection.disconnect();
//     },
//   };
// };

// let id = 0;

// const connection = provider((msg) => {
//   const parsedMsg = JSON.parse(msg);

//   // Figure out follow subscription
//   if (parsedMsg.result && !parsedMsg.method) {
//     followSubscriptionId = parsedMsg.result;
//   } else if (parsedMsg.method === "chainHead_v1_followEvent" &&
//             parsedMsg.params.result.event === "stop") {
//     sendFollow();
//   }
// });

// function getBody(blockHash: string) {
//   connection.send(
//     JSON.stringify({
//       jsonrpc: "2.0",
//       id: ++id,
//       method: "chainHead_v1_body",
//       params: [followSubscriptionId, blockHash],
//     })
//   );
// }

// function sendFollow() {
//   connection.send(
//     JSON.stringify({
//       jsonrpc: "2.0",
//       id: ++id,
//       method: "chainHead_v1_follow",
//       params: [true],
//     })
//   );
// }
// sendFollow();

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>
// );



import { MultiAddress, dot, nextLocal } from "@polkadot-api/descriptors";
import { getMultisigSigner } from "@polkadot-api/meta-signers";
import {
  Binary,
  CompatibilityLevel,
  createClient,
  getTypedCodecs,
  type PolkadotSigner,
  type SS58String,
} from "polkadot-api";
import { connectInjectedExtension } from "polkadot-api/pjs-signer";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { useEffect, useState } from "react";
import "./App.css";

const client = createClient(
  getWsProvider("wss://polkadot-rpc.publicnode.coms")
);
const typedApi = client.getTypedApi(dot);
const nextApi = client.getTypedApi(nextLocal);

const extension = await connectInjectedExtension("polkadot-js");
const signerAccount = extension
  .getAccounts()
  .find((v) => v.name === "PBA Oliva")!;

// const multisigSigner = getMultisigSigner(
//   {
//     signatories: ["Josep", "Carlo", "Victor"],
//     threshold: 2,
//   },
//   typedApi.query.Multisig.Multisigs.getValue,
//   typedApi.apis.TransactionPaymentApi.query_info,
//   signerAccount.polkadotSigner
// );

const typedCodecs = await getTypedCodecs(dot);

// typedCodecs.tx.Proxy.proxy.enc();
// await typedApi.txFromCallData()

const createProxySigner = (
  proxied: SS58String,
  signer: PolkadotSigner
): PolkadotSigner => ({
  publicKey: signer.publicKey,
  signBytes() {
    throw new Error("Can't sign bytes");
  },
  async signTx(callData, signedExtensions, metadata, atBlockNumber, hasher) {
    // const tx = await typedApi.txFromCallData(Binary.fromBytes(callData));
    const decodedCall = typedCodecs.tx.Proxy.proxy.inner.call.dec(callData);

    return signer.signTx(
      typedCodecs.tx.Proxy.proxy.enc({
        real: MultiAddress.Id(proxied),
        call: decodedCall,
        force_proxy_type: undefined,
      }),
      signedExtensions,
      metadata,
      atBlockNumber,
      hasher
    );
  },
});

function App() {
  const [account, setAccount] = useState("");
  const [remark, setRemark] = useState("");
  const [amount, setAmount] = useState(0);
  const [requiresRemark, setRequiresRemark] = useState(false);

  useEffect(() => {
    client.finalizedBlock$.subscribe(async () => {
      if (
        !(await typedApi.tx.Balances.transfer_keep_alive.isCompatible(
          CompatibilityLevel.BackwardsCompatible
        ))
      ) {
        setRequiresRemark(true);
      }
    });
  }, []);

  const submit = () => {
    const tx = requiresRemark
      ? nextApi.tx.Balances.transfer_keep_alive({
          dest: MultiAddress.Id(account),
          value: BigInt(amount),
          remark: Binary.fromText(remark),
        })
      : typedApi.tx.Balances.transfer_keep_alive({
          dest: MultiAddress.Id(account),
          value: BigInt(amount),
        });

    tx.signSubmitAndWatch(multisigSigner).subscribe((r) => {
      console.log(r);
    });
  };

  return (
    <>
      <h3>Transfer!</h3>
      <div>
        Account
        <input
          type="text"
          value={account}
          onChange={(evt) => setAccount(evt.target.value)}
        />
      </div>
      <div>
        Amount
        <input
          type="number"
          value={amount}
          onChange={(evt) => setAmount(evt.target.valueAsNumber)}
        />
      </div>
      {requiresRemark ? (
        <div>
          Remark
          <input
            type="text"
            value={remark}
            onChange={(evt) => setRemark(evt.target.value)}
          />
        </div>
      ) : null}
      <button type="button" onClick={submit}>
        Submit
      </button>
    </>
  );
}

export default App;