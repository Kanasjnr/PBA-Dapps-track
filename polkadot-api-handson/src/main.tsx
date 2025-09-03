import { pas,dot } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { chainSpec } from "polkadot-api/chains/polkadot";
import { getSmProvider } from "polkadot-api/sm-provider";
import type { JsonRpcProvider } from "polkadot-api/ws-provider/web";
import { start } from "polkadot-api/smoldot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const smoldot = start();
const chain = smoldot.addChain({
  chainSpec,
});

const smoldotProvider = getSmProvider(chain);

const provider: JsonRpcProvider = (onMsg) => {
  const smoldotConnection = smoldotProvider((msg) => {
    console.log(JSON.parse(msg));
    onMsg(msg);
  });

  return {
    send(message) {
      console.log(JSON.parse(message));
      smoldotConnection.send(message);
    },
    disconnect() {
      smoldotConnection.disconnect();
    },
  };
};

let id = 0;

const connection = provider((msg) => {
  const parsedMsg = JSON.parse(msg);

  // Figure out follow subscription
  if (parsedMsg.result && !parsedMsg.method) {
    followSubscriptionId = parsedMsg.result;
  } else if (parsedMsg.method === "chainHead_v1_followEvent" && 
            parsedMsg.params.result.event === "stop") {
    sendFollow();
  }
});

function getBody(blockHash: string) {
  connection.send(
    JSON.stringify({
      jsonrpc: "2.0",
      id: ++id,
      method: "chainHead_v1_body",
      params: [followSubscriptionId, blockHash],
    })
  );
}

function sendFollow() {
  connection.send(
    JSON.stringify({
      jsonrpc: "2.0",
      id: ++id,
      method: "chainHead_v1_follow",
      params: [true],
    })
  );
}
sendFollow();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);