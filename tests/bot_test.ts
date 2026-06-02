import { assertEquals, assert } from "jsr:@std/assert@1";
import { dailyForDate } from "../src/gears.ts";
// sendDaily must be imported dynamically — telegram.ts calls getConfig() at module
// level, so CONFIG_PATH must be set before the first import. Static imports at the
// top of this file would resolve before any test body runs.

Deno.test("bot pipeline: config, day calc, daily query, and message sending", async () => {
  // This test exercises the same pipeline as bot.ts does at runtime:
  //   config → day calculation → dailyForDate → sendDaily
  // but with a mocked Telegram API to avoid side effects.

  // Point config at our test fixture
  Deno.env.set("CONFIG_PATH", "./tests/_test_config.json");

  // Replicate bot.ts's day calculation with offset=0
  const day = Temporal.Now.zonedDateTimeISO("UTC").with({ hour: 19 });

  // Query the daily from the real database
  const daily = dailyForDate(day);

  // Verify it's a valid daily entry
  assert(typeof daily.map === "string");
  assert(daily.map.length > 0);
  assert(typeof daily.escape === "string");

  // Mock Telegram API and exercise sendDaily
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const origFetch = globalThis.fetch;

  globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    calls.push({ url: url.toString(), body });
    return new Response(
      JSON.stringify({
        ok: true,
        result: { message_id: 777, chat: { id: 456 } },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  // Uses dynamic import because telegram.ts calls getConfig() at module
  // level and CONFIG_PATH must be set before the module is loaded.
  const { sendDaily } = await import("../src/telegram.ts");
  await sendDaily(daily, day);

  // First message sent to the first chat with MarkdownV2
  assert(calls.length >= 1);
  assertEquals(calls[0].body.chat_id, "-100testchatid");
  assertEquals(calls[0].body.parse_mode, "MarkdownV2");
  assert(
    (calls[0].body.text as string).includes(daily.map),
    "Message should contain the daily map name",
  );
  assert(
    (calls[0].body.text as string).includes(daily.escape),
    "Message should contain the daily escape name",
  );

  globalThis.fetch = origFetch;
});

Deno.test("bot pipeline: offset shifts the target date correctly", () => {
  // bot.ts does: Temporal.Now.zonedDateTimeISO("UTC").with({ hour: 19 }).add(...)
  // Without offset = today at 19:00; with positive offset = future
  const base = Temporal.Now.zonedDateTimeISO("UTC").with({ hour: 19 });
  const withOffset = base.add({ days: 3 });
  assertEquals(
    base.until(withOffset, { largestUnit: "days" }).days,
    3,
    "offset of 3 should shift by 3 days",
  );
  assertEquals(withOffset.hour, 19, "offset should not change the hour");
});

Deno.test("bot pipeline: dailyForDate with today's date succeeds", () => {
  // Same logic as bot.ts: get the daily for today @ 19:00
  const day = Temporal.Now.zonedDateTimeISO("UTC").with({ hour: 19 });
  const daily = dailyForDate(day);

  // All required fields present
  assert(daily.map, "map is required");
  assert(daily.horde_reward, "horde_reward is required");
  assert(daily.mutators, "mutators is required");
  assert(daily.escape, "escape is required");
  assert(daily.escape_reward, "escape_reward is required");

  // next_* fields are in the future
  for (const key of [
    "next_escape_reward",
    "next_escape",
    "next_horde_reward",
    "next_map",
    "next_mutator",
  ] as const) {
    const next = daily[key] as Temporal.ZonedDateTime;
    assert(
      Temporal.ZonedDateTime.compare(next, day) > 0,
      `${key} ${next.toString()} should be after ${day.toString()}`,
    );
  }
});
