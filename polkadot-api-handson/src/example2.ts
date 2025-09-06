import { createClient } from "polkadot-api";
import { chainSpec } from "polkadot-api/chains/paseo";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { pas } from "@polkadot-api/descriptors";
import { switchMap, filter } from "rxjs";

const smoldot = start();
const chain = smoldot.addChain({
  chainSpec,
});
const client = createClient(getSmProvider(chain));
const typedApi = client.getTypedApi(pas);

typedApi.query.Sudo.Key.watchValue().subscribe((r) => {
  console.log("sudo key", r);
});

typedApi.query.System.Account.watchValue("Sudo key").subscribe((r) => {});

const sudoAccountObservable$ = typedApi.query.Sudo.Key.watchValue().pipe(
  filter((sudoKey) => sudoKey !== null && sudoKey !== undefined), 
  switchMap((sudoKey) => {
    console.log("sudo key from observable:", sudoKey);
    return typedApi.query.System.Account.watchValue(sudoKey);
  })
);

sudoAccountObservable$.subscribe((sudoAccount) => {
  console.log("Sudo account :", sudoAccount);
  
});