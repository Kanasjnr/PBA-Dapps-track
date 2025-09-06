import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { dot } from "@polkadot-api/descriptors";
import { switchMap, map } from "rxjs";

const client = createClient(
  getWsProvider("wss://polkadot-rpc.publicnode.com")
);
const api = client.getTypedApi(dot);

const ACCOUNT = "1jbZxCFeNMRgVRfggkknf8sTWzrVKbzLvRuLWvSyg9bByRG";
const TRACK = 33;

const getVoteDirection = (vote: number) =>
  vote & 0x80 ? "aye" : "nay";

const getReferendumOutcome = (info: any) => {
  if (!info?.Ongoing) return null;
  const tally = info.Ongoing.tally;
  return tally.ayes > tally.nays ? "aye" : "nay";
};

const referendaWithSameOutcome$ = api.query.ConvictionVoting.VotingFor
  .watchValue(ACCOUNT, TRACK)
  .pipe(
    switchMap((votingFor) => {
      if (!votingFor?.Casting) return [];

      const votes = votingFor.Casting.votes.map(([refId, accountVote]) => ({
        referendumId: refId,
        direction: getVoteDirection(accountVote.vote as number),
      }));

      const ids = votes.map((v) => [v.referendumId]); 

      return api.query.Referenda.ReferendumInfoFor.getValues(ids).pipe(
        map((infos) => {
          return votes.filter((v) => {
            const match = infos.find((i) => i.key[0] === v.referendumId);
            if (!match?.value) return false;
            const outcome = getReferendumOutcome(match.value);
            return outcome && outcome === v.direction;
          });
        })
      );
    })
  );

referendaWithSameOutcome$.subscribe((result) => {
  console.log(" Referenda where account voted same as outcome:", result);
});
