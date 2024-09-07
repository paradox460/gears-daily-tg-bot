const token = Deno.env.get("BOT_TOKEN") as string;
const chat = Deno.env.get("CHAT_ID") as string;
const thread = Deno.env.get("THREAD_ID");

import { ImageWithDate } from "./gears.ts";

export async function sendPhoto({ image, date }: ImageWithDate) {
  const [firstChat, ...otherChats] = chat.split(",");
  console.log("sending image");
  const formData = new FormData();
  formData.append("photo", image, `daily_${date.toISOString()}.jpg`);
  formData.append("caption", `${date.format("dddd, MMMM D")}`);
  formData.append("chat_id", firstChat);
  if (thread) {
    formData.append("message_thread_id", thread);
  }
  formData.append("show_caption_above_media", "True");

  const request = new Request(
    `https://api.telegram.org/bot${token}/sendPhoto`,
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

  for (const chat_id of otherChats) {
    const request = new Request(
      `https://api.telegram.org/bot${token}/copyMessage`,
      {
        // const request = new Request(`https://httpbin.org/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          chat_id,
          from_chat_id,
          message_id,
        }),
      },
    );

    const response = await fetch(request);
    console.log(response);
  }
}
