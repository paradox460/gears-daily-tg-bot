import dayjs from "./dayjs_setup.ts";
import { Database } from "jsr:@db/sqlite@0.11";

const db = new Database("database.db", {
  readonly: true,
  create: false,
});
db.exec("pragma journal_mode = WAL");

const epoch = dayjs.utc("2024-03-13T19:00:00Z");
export interface Daily extends Record<string, number | string | dayjs.Dayjs> {
  escape_reward: string;
  escape: string;
  horde_reward: string;
  map: string;
  mutators: string;
  next_escape_reward: dayjs.Dayjs;
  next_escape: dayjs.Dayjs;
  next_horde_reward: dayjs.Dayjs;
  next_map: dayjs.Dayjs;
  next_mutator: dayjs.Dayjs;
}

interface InternalDaily extends Daily {
  escape_reward_id: number;
  horde_reward_id: number;
  mutator_id: number;
  escape_id: number;
  map_id: number;
}

function getNext(
  { table, key, id, day }: {
    table: string;
    key: string;
    id: number;
    day: number;
  },
): dayjs.Dayjs {
  const nextDay = db.prepare(`
 SELECT
  day
FROM
  dailies
  JOIN ${table} ON dailies.${key}_id = ${table}.id
WHERE
  dailies.day > :day
  AND dailies.${key}_id = :id
LIMIT 1
    `).value({ day, id })?.[0];
  if (!nextDay) {
    throw new Error("No next day found");
  }
  return epoch.add(nextDay as number, "days");
}
function query(day: number): Daily {
  const results: InternalDaily | undefined = db.prepare(`
SELECT
  dailies.*,
  maps.name AS map,
  mutators.mutators,
  horde_rewards.reward AS 'horde_reward',
  escapes.name AS 'escape',
  escape_rewards.reward AS 'escape_reward'
FROM
  'dailies'
  JOIN maps ON dailies.map_id = maps.id
  JOIN mutators ON dailies.mutator_id = mutators.id
  JOIN rewards AS horde_rewards ON dailies.horde_reward_id = horde_rewards.id
  JOIN rewards AS escape_rewards ON dailies.escape_reward_id = escape_rewards.id
  JOIN escapes ON dailies.escape_id = escapes.id
WHERE
  dailies.day = ?
`).get<InternalDaily>(day);

  if (!results) {
    throw new Error("No daily found for the provided date");
  }

  return {
    escape_reward: results.escape_reward,
    escape: results.escape,
    horde_reward: results.horde_reward,
    map: results.map,
    mutators: results.mutators,
    next_escape_reward: getNext({
      table: "rewards",
      key: "escape_reward",
      id: results.escape_reward_id,
      day,
    }),
    next_escape: getNext({
      table: "escapes",
      key: "escape",
      id: results.escape_id,
      day,
    }),
    next_horde_reward: getNext({
      table: "rewards",
      key: "horde_reward",
      id: results.horde_reward_id,
      day,
    }),
    next_map: getNext({ table: "maps", key: "map", id: results.map_id, day }),
    next_mutator: getNext({
      table: "mutators",
      key: "mutator",
      id: results.mutator_id,
      day,
    }),
  };
}

export function dailyForDate(date: dayjs.Dayjs) {
  const dayDiff = epoch.diff(date, "days") * -1 % 401;

  return query(dayDiff);
}
