import { assertEquals, assert } from "jsr:@std/assert@1";
import dayjs from "../src/dayjs_setup.ts";
import type { Daily } from "../src/gears.ts";

// Point config at test fixture before the module is loaded
Deno.env.set("CONFIG_PATH", "./tests/_test_config.json");

function makeMockDaily(): Daily {
  const base = dayjs.utc("2024-03-13T19:00:00Z");
  return {
    map: "Clocktower 🏫",
    horde_reward: "1 Legendary Card / 4 Cards / 200 Coins",
    mutators: "Reduced Bleeding Damage ❤️‍🩹, Survivor 🪦",
    escape: "The Ambush 🐇",
    escape_reward: "10,000 CXP / 5,000 CXP / 200 Coins",
    next_map: base.add(7, "day"),
    next_horde_reward: base.add(3, "day"),
    next_mutator: base.add(14, "day"),
    next_escape: base.add(10, "day"),
    next_escape_reward: base.add(5, "day"),
  };
}

interface FetchCall {
  url: string;
  body: Record<string, unknown>;
}

Deno.test("sendDaily sends message to the first chat", async () => {
  const calls: FetchCall[] = [];
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

  const { sendDaily } = await import("../src/telegram.ts");

  const daily = makeMockDaily();
  const day = dayjs.utc("2024-03-13T19:00:00Z");
  await sendDaily(daily, day);

  // First call: sendMessage to the first chat
  assertEquals(calls.length, 2);
  assert(
    calls[0].url.includes("/sendMessage"),
    `Expected /sendMessage URL, got ${calls[0].url}`,
  );
  assertEquals(calls[0].body.chat_id, "-100testchatid");

  // Second call: forwardMessage (forward: true in test config for 2nd chat)
  assert(
    calls[1].url.includes("/forwardMessage"),
    `Expected /forwardMessage URL, got ${calls[1].url}`,
  );
  assertEquals(calls[1].body.chat_id, "-100testchat2");
  assertEquals(calls[1].body.from_chat_id, 456);
  assertEquals(calls[1].body.message_id, 777);

  globalThis.fetch = origFetch;
});

Deno.test("sendDaily sends message with correct parse_mode and formatting", async () => {
  const calls: FetchCall[] = [];
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

  const { sendDaily } = await import("../src/telegram.ts");

  const daily = makeMockDaily();
  const day = dayjs.utc("2024-03-13T19:00:00Z");
  await sendDaily(daily, day);

  const message = calls[0].body.text as string;

  assertEquals(calls[0].body.parse_mode, "MarkdownV2");
  assert(message.includes("Clocktower"));
  assert(message.includes("Horde Daily"));
  assert(message.includes("Escape Daily"));
  assert(message.includes("Mutators"));
  assert(message.includes("March 13"));

  globalThis.fetch = origFetch;
});

Deno.test("sendDaily includes thread_id and silent parameters per chat config", async () => {
  const calls: FetchCall[] = [];
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

  const { sendDaily } = await import("../src/telegram.ts");

  const daily = makeMockDaily();
  const day = dayjs.utc("2024-03-13T19:00:00Z");
  await sendDaily(daily, day);

  // First chat has no thread_id / silent
  assertEquals(calls[0].body.message_thread_id, undefined);
  assertEquals(calls[0].body.disable_notification, undefined);

  // Second chat has thread_id=42 and silent=true
  assertEquals(calls[1].body.message_thread_id, "42");
  assertEquals(calls[1].body.disableNotification, true);

  globalThis.fetch = origFetch;
});
Deno.test("sendDaily message format contains all required sections", async () => {
  const calls: FetchCall[] = [];
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

  const { sendDaily } = await import("../src/telegram.ts");

  const daily = makeMockDaily();
  const day = dayjs.utc("2024-03-13T19:00:00Z");
  await sendDaily(daily, day);

  const message = calls[0].body.text as string;

  // Heading: day of week and date
  assert(message.startsWith("*Wednesday, March 13*"), "Should start with formatted date");

  // Horde section
  assert(message.includes("*Horde Daily: Clocktower 🏫*"));
  assert(message.includes("1 Legendary Card / 4 Cards / 200 Coins"));
  assert(message.includes("_Map/Reward next appearance: March 20 / March 16_"));

  // Mutators section
  assert(message.includes("*Mutators*: Reduced Bleeding Damage ❤️‍🩹, Survivor 🪦"));
  assert(message.includes("_*Mutators next appearance:* March 27_"));

  // Escape section
  assert(message.includes("*Escape Daily: The Ambush 🐇*"));
  assert(message.includes("10,000 CXP / 5,000 CXP / 200 Coins"));
  assert(message.includes("_Escape/Reward next appearance: March 23 / March 18_"));

  globalThis.fetch = origFetch;
});
