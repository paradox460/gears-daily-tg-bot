import dayjs from "./dayjs_setup.ts";
import type { Daily } from "./gears.ts";

const configPath = Deno.env.get("CONFIG_PATH") ?? "./config.json";

interface Chat {
  chat_id: string;
  thread_id?: string;
  silent?: boolean;
  forward?: boolean;
}

interface Config {
  chats: Chat[];
  token?: string;
}

interface SuccessfulSend {
  message_id: number;
  from_chat_id: number;
}

function getConfig(): Config {
  const rawConfig = Deno.readTextFileSync(configPath);
  const config = JSON.parse(rawConfig) as Config;
  const token = Deno.env.get("BOT_TOKEN");
  if (token) {
    config.token = token;
  }
  return config;
}
const config = getConfig();

function buildMessage(daily: Daily, day: dayjs.Dayjs) {
  return `
*${day.format("dddd, MMMM D")}*

*Horde Daily: ${daily.map}*
${daily.horde_reward}
_Map/Reward next appearance: ${daily.next_map.format("MMMM D")} / ${
    daily.next_horde_reward.format("MMMM D")
  }_

*Mutators*: ${daily.mutators}
_*Mutators next appearance:* ${daily.next_mutator.format("MMMM D")}_

*Escape Daily: ${daily.escape}*
${daily.escape_reward}
_Escape/Reward next appearance: ${daily.next_escape.format("MMMM D")} / ${
    daily.next_escape_reward.format("MMMM D")
  }_
`.trim().replace(/\./, "\\.");
}

async function sendMessage(
  message: string,
  chat: Chat,
): Promise<SuccessfulSend> {
  const response = await fetch(
    `https://api.telegram.org/bot${config.token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        chat_id: chat.chat_id,
        ...(chat.thread_id ? { message_thread_id: chat.thread_id } : {}),
        text: message,
        ...(chat.silent ? { disable_notification: true } : {}),
        parse_mode: "MarkdownV2",
      }),
    },
  );

  const json = await response.json();

  const { message_id, chat: { id: from_chat_id } } = json.result;

  return { message_id, from_chat_id };
}

async function copyOrForwardMessage(
  { message_id, from_chat_id }: SuccessfulSend,
  chat: Chat,
) {
  const func = chat.forward ? "forwardMessage" : "copyMessage";
  const response = await fetch(
    `https://api.telegram.org/bot${config.token}/${func}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        chat_id: chat.chat_id,
        from_chat_id,
        message_id,
        ...(chat.thread_id ? { message_thread_id: chat.thread_id } : {}),
        disableNotification: !!chat.silent,
      }),
    },
  );

  console.log(response);
}

export async function sendDaily(daily: Daily, day: dayjs.Dayjs) {
  const [firstChat, ...otherChats] = config.chats;
  const message = buildMessage(daily, day);
  console.log("Message:\n", message)
  const firstSuccess = await sendMessage(message, firstChat);
  for (const chat of otherChats) {
    copyOrForwardMessage(firstSuccess, chat);
  }
}
