import ical, {
  ICalCalendarMethod,
  ICalDescription,
  ICalEventRepeatingFreq,
  ICalRepeatingOptions,
} from "npm:ical-generator";

import { DatabaseSync } from "node:sqlite";

const databasePath = import.meta.dirname + "/../data/database.db";
const db = new DatabaseSync(databasePath, { readOnly: true });

export const epoch = Temporal.ZonedDateTime.from("2024-03-13T19:00:00[UTC]");
const allDailies = db.prepare(`
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
`).all();

const calendar = ical({
  name: "Gears 5 Daily Schedule",
  description: "Dailies for Gears 5 Horde and Escape",
  method: ICalCalendarMethod.REQUEST,
});

function calcDate(offset: number) {
  return epoch.add({ days: offset });
}

for (const daily of allDailies) {
  const date = calcDate(daily.day as number);

  const description: ICalDescription = {
    plain: `
Horde Daily: ${daily.map}
${daily.horde_reward}

Mutators: ${daily.mutators}

Escape Daily: ${daily.escape}
${daily.escape_reward}
`.trim(),
    html: `
    <strong>Horde Daily:<strong> ${daily.map}<br>
    ${daily.horde_reward}<br>

    <strong>Mutators:</strong> ${daily.mutators}<br>

    <strong>Escape Daily:</strong> ${daily.escape}<br>
    ${daily.escape_reward}<br>
    `.trim(),
  };

  const repeating: ICalRepeatingOptions = {
    freq: ICalEventRepeatingFreq.DAILY,
    interval: 401,
  };

  calendar.createEvent({
    start: new Date(date.epochMilliseconds),
    end: new Date(date.add({ days: 1 }).epochMilliseconds),
    summary: `H: ${daily.map} | E: ${daily.escape}`,
    description,
    repeating,
  });
}

Deno.writeTextFileSync("schedule.ics", calendar.toString());
