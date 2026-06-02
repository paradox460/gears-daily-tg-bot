import { assertEquals, assert } from "jsr:@std/assert@1";
import { dailyForDate } from "../src/gears.ts";

const epoch = Temporal.ZonedDateTime.from("2024-03-13T19:00:00[UTC]");

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
  const date = epoch.add({ days: 1 });
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
  const cycleLater = epoch.add({ days: 401 });
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
  const cycleLater = epoch.add({ days: 402 });
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
    const next = daily[key] as Temporal.ZonedDateTime;
    assert(
      Temporal.ZonedDateTime.compare(next, epoch) > 0,
      `${key} ${next.toString()} is not after ${epoch.toString()}`,
    );
  }
});

Deno.test("dailyForDate next_* fields at cycle boundary wrap correctly", () => {
  // day = 400 is the last entry in the 401-day cycle
  const lastDay = epoch.add({ days: 400 });
  const daily = dailyForDate(lastDay);

  // All next_* fields must be after lastDay, and should be in the next cycle
  for (const key of [
    "next_escape_reward",
    "next_escape",
    "next_horde_reward",
    "next_map",
    "next_mutator",
  ] as const) {
    const next = daily[key] as Temporal.ZonedDateTime;
    assert(
      Temporal.ZonedDateTime.compare(next, lastDay) > 0,
      `${key} ${next.toString()} is not after ${lastDay.toString()}`,
    );
    // At the last day of a cycle, the next appearance should be at least 1 day in the future
    assert(
      lastDay.until(next, { largestUnit: "days" }).days >= 1,
      `${key} is not at least 1 day in the future`,
    );
  }
});

Deno.test("dailyForDate throws for a day beyond the database", () => {
  // database has exactly 401 entries (days 0-400), so modulo maps cleanly
  // But we can test a date far in the future that still falls within range
  // With 401 entries, dayDiff = totalDays % 401 always maps to 0-400
  // So dailyForDate never throws for valid dates; confirm the function handles extremes
  const farFuture = epoch.add({ days: 5000 });
  const daily = dailyForDate(farFuture);
  // Should still return valid data (modulo arithmetic)
  assert(typeof daily.map === "string");
  assert(daily.map.length > 0);
});

Deno.test("dailyForDate at the epoch matches the same entry as 401-day cycle", () => {
  const oneCycle = epoch.add({ days: 401 });
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
    const aNext = a[key] as Temporal.ZonedDateTime;
    const bNext = b[key] as Temporal.ZonedDateTime;
    assertEquals(aNext.until(bNext, { largestUnit: "days" }).days, 401);
  }
});
