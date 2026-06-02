import type { Daily } from "./gears.ts";
import getConfig, { Chat } from "./config.ts";

interface SuccessfulSend {
  message_id: number;
  from_chat_id: number;
}

const config = getConfig();

function buildMessage(daily: Daily, day: Temporal.ZonedDateTime) {
  const fullDate = day.toLocaleString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const monthDay = (zdt: Temporal.ZonedDateTime) =>
    zdt.toLocaleString("en", { month: "long", day: "numeric" });
  return `
*${fullDate}*

*Horde Daily: ${daily.map}*
${daily.horde_reward}
_Map/Reward next appearance: ${monthDay(daily.next_map)} / ${
    monthDay(daily.next_horde_reward)
  }_

*Mutators*: ${daily.mutators}
_*Mutators next appearance:* ${monthDay(daily.next_mutator)}_

*Escape Daily: ${daily.escape}*
${daily.escape_reward}
_Escape/Reward next appearance: ${monthDay(daily.next_escape)} / ${
    monthDay(daily.next_escape_reward)
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

export async function sendDaily(daily: Daily, day: Temporal.ZonedDateTime) {
  const [firstChat, ...otherChats] = config.chats;
  const message = buildMessage(daily, day);
  console.log("Message:\n", message);
  const firstSuccess = await sendMessage(message, firstChat);
  for (const chat of otherChats) {
    copyOrForwardMessage(firstSuccess, chat);
  }
}
