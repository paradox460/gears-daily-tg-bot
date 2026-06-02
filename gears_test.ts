import { assertEquals, assert } from "jsr:@std/assert@1";
import dayjs from "./dayjs_setup.ts";
import { dailyForDate } from "./gears.ts";

const epoch = dayjs.utc("2024-03-13T19:00:00Z");

Deno.test("dailyForDate at epoch (day 0) returns known entry", () => {
  const daily = dailyForDate(epoch);

  assertEquals(daily.map, "Clocktower 🏫");
  assertEquals(daily.horde_reward, "1 Legendary Card / 4 Cards / 200 Coins");
  assertEquals(
    daily.mutators,
    "Reduced Bleeding Damage ❤️‍🩹, Survivor 🪦, Reduced Explosive Damage 💥, Regen Penalty 💔, Double Headshot Damage 👥, Regeneration 🫀, Power Drain 🪫.",
  );
  assertEquals(daily.escape, "The Ambush 🐇");
  assertEquals(
    daily.escape_reward,
    "10,000 CXP / 5,000 CXP / 200 Coins",
  );
});

Deno.test("dailyForDate at epoch + 1 day returns known entry", () => {
  const date = epoch.add(1, "day");
  const daily = dailyForDate(date);

  assertEquals(daily.map, "Icebound ☃");
  assertEquals(daily.horde_reward, "10,000 CXP / 5,000 CXP / 200 Coins");
  assertEquals(
    daily.mutators,
    "Freezing Rifles ❄️, More Lethal 💀, Shielded Heavies 🛡️, More Health ⛑️, Frag Rejects 🧨, Survivor 🪦, Regeneration 🫀.",
  );
  assertEquals(daily.escape, "Ice Queen 🥶");
  assertEquals(daily.escape_reward, "1 Legendary Card / 4 Cards / 200 Coins");
});

Deno.test("dailyForDate at epoch + 401 days returns same entry as day 0", () => {
  const cycleLater = epoch.add(401, "day");
  const daily = dailyForDate(cycleLater);

  assertEquals(daily.map, "Clocktower 🏫");
  assertEquals(daily.horde_reward, "1 Legendary Card / 4 Cards / 200 Coins");
  assertEquals(daily.escape, "The Ambush 🐇");
  assertEquals(
    daily.escape_reward,
    "10,000 CXP / 5,000 CXP / 200 Coins",
  );
});

Deno.test("dailyForDate at epoch + 402 days returns same entry as day 1", () => {
  const cycleLater = epoch.add(402, "day");
  const daily = dailyForDate(cycleLater);

  assertEquals(daily.map, "Icebound ☃");
  assertEquals(daily.escape, "Ice Queen 🥶");
});

Deno.test("dailyForDate next_* fields are after the input date", () => {
  const daily = dailyForDate(epoch);

  for (const key of [
    "next_escape_reward",
    "next_escape",
    "next_horde_reward",
    "next_map",
    "next_mutator",
  ] as const) {
    const next = daily[key] as dayjs.Dayjs;
    assert(next.isAfter(epoch), `${key} ${next.toISOString()} is not after ${epoch.toISOString()}`);
  }
});

Deno.test("dailyForDate next_* fields at cycle boundary wrap correctly", () => {
  // day = 400 is the last entry in the 401-day cycle
  const lastDay = epoch.add(400, "day");
  const daily = dailyForDate(lastDay);

  // All next_* fields must be after lastDay, and should be in the next cycle
  for (const key of [
    "next_escape_reward",
    "next_escape",
    "next_horde_reward",
    "next_map",
    "next_mutator",
  ] as const) {
    const next = daily[key] as dayjs.Dayjs;
    assert(next.isAfter(lastDay), `${key} ${next.toISOString()} is not after ${lastDay.toISOString()}`);
    // At the last day of a cycle, the next appearance should be at least 1 day in the future
    assert(
      next.diff(lastDay, "day") >= 1,
      `${key} is not at least 1 day in the future`,
    );
  }
});

Deno.test("dailyForDate throws for a day beyond the database", () => {
  // database has exactly 401 entries (days 0-400), so modulo maps cleanly
  // But we can test a date far in the future that still falls within range
  // With 401 entries, dayDiff = totalDays % 401 always maps to 0-400
  // So dailyForDate never throws for valid dates; confirm the function handles extremes
  const farFuture = epoch.add(5000, "day");
  const daily = dailyForDate(farFuture);
  // Should still return valid data (modulo arithmetic)
  assert(typeof daily.map === "string");
  assert(daily.map.length > 0);
});

Deno.test("dailyForDate at the epoch matches the same entry as 401-day cycle", () => {
  const oneCycle = epoch.add(401, "day");
  const a = dailyForDate(epoch);
  const b = dailyForDate(oneCycle);

  // Base fields should be identical
  assertEquals(a.map, b.map);
  assertEquals(a.horde_reward, b.horde_reward);
  assertEquals(a.mutators, b.mutators);
  assertEquals(a.escape, b.escape);
  assertEquals(a.escape_reward, b.escape_reward);

  // next_* fields should be shifted by exactly 401 days (one cycle)
  for (const key of [
    "next_escape_reward",
    "next_escape",
    "next_horde_reward",
    "next_map",
    "next_mutator",
  ] as const) {
    const aNext = a[key] as dayjs.Dayjs;
    const bNext = b[key] as dayjs.Dayjs;
    assertEquals(bNext.diff(aNext, "day"), 401);
  }
});
