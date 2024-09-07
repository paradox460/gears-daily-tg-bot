const configPath = Deno.env.get("CONFIG_PATH") ?? "./config.json";

import { ImageWithDate } from "./gears.ts";

interface Chat {
  chat_id: string;
  thread_id?: string;
  silent?: boolean;
  forward?: boolean;
}

export interface Config {
  chats: Chat[];
  token?: string;
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

export async function sendPhoto({ image, date }: ImageWithDate) {
  const config = getConfig();
  const [firstChat, ...otherChats] = config.chats;
  console.log("sending image");
  const formData = new FormData();
  formData.append("photo", image, `daily_${date.toISOString()}.jpg`);
  formData.append("caption", `${date.format("dddd, MMMM D")}`);
  formData.append("chat_id", firstChat.chat_id);
  if (firstChat.thread_id) {
    formData.append("message_thread_id", firstChat.thread_id);
  }
  formData.append("show_caption_above_media", "True");
  if (firstChat.silent) {
    formData.append("disable_notification", "True");
  }

  const request = new Request(
    `https://api.telegram.org/bot${config.token}/sendPhoto`,
    {
      method: "POST",
      body: formData,
    },
  );

  console.log(request);

  const response = await fetch(request);

  console.log(response);

  const {
    message_id,
    chat: { id: from_chat_id },
  } = await response.json().then((json) => json.result);

  console.log("Forwarding to additional channels, if any");

  for (const chat of otherChats) {
    const func = chat.forward ? "forwardMessage" : "copyMessage";
    const request = new Request(
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
          ...(chat.thread_id? { message_thread_id: chat.thread_id} : {}),
          disableNotification: !!chat.silent,
        }),
      },
    );

    const response = await fetch(request);
    console.log(response);
  }
}
