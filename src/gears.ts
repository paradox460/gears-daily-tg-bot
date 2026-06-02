import dayjs from "./dayjs_setup.ts";
import { DatabaseSync } from "node:sqlite";

const databasePath = import.meta.dirname + "/../data/database.db";
const db = new DatabaseSync(databasePath, { readOnly: true });

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
  { table, key, id, day, totalDays }: {
    table: string;
    key: string;
    id: number;
    day: number;
    totalDays: number;
  },
): dayjs.Dayjs {
  let nextDay: number | undefined = db.prepare(`
    SELECT
      day
    FROM
      dailies
      JOIN ${table} ON dailies.${key}_id = ${table}.id
    WHERE
      dailies.day > ?
      AND dailies.${key}_id = ?
    LIMIT 1
    `).get(day, id)?.day as number | undefined;
  if (!nextDay) {
    // In the event that we don't find a next day, we're at or near the end of
    // the cycle, and should restart it.
    // Yes, you could do this in pure SQL with a big CASE or an IIF statement,
    // but thats messy and ugly and difficult to read
    nextDay = db.prepare(`
      SELECT
        day
      FROM
        dailies
        JOIN ${table} ON dailies.${key}_id = ${table}.id
      WHERE
        dailies.${key}_id = ?
      LIMIT 1
    `).get(id)?.day as number | undefined;
  }
  if (nextDay === undefined) {
    throw new Error(
      `No day found for table=${table}, key=${key}, id=${id}`,
    );
  }
  const cycles = Math.floor(totalDays / 401);
  const cycleOffset = (nextDay <= day) ? (cycles + 1) : cycles;
  return epoch.add(nextDay + cycleOffset * 401, "days");
}
function query(day: number, totalDays: number): Daily {
  const results = db.prepare(`
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
  `).get(day) as InternalDaily | undefined;
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
      totalDays,
    }),
    next_escape: getNext({
      table: "escapes",
      key: "escape",
      id: results.escape_id,
      day,
      totalDays,
    }),
    next_horde_reward: getNext({
      table: "rewards",
      key: "horde_reward",
      id: results.horde_reward_id,
      day,
      totalDays,
    }),
    next_map: getNext({ table: "maps", key: "map", id: results.map_id, day, totalDays }),
    next_mutator: getNext({
      table: "mutators",
      key: "mutator",
      id: results.mutator_id,
      day,
      totalDays,
    }),
  };
}

export function dailyForDate(date: dayjs.Dayjs) {
  const totalDays = -(epoch.diff(date, "days"));
  const dayDiff = (totalDays % 401) || 0;

  return query(dayDiff, totalDays);
}
