const token = Deno.env.get("BOT_TOKEN") as string;
const chat = Deno.env.get("CHAT_ID") as string;
const thread = Deno.env.get("THREAD_ID") as string;

import { ImageWithDate } from "./gears.ts";

export async function sendPhoto({image, date}: ImageWithDate) {
  console.log("sending image")
  const formData = new FormData();
  formData.append("photo", image, `daily_${date.toISOString()}.jpg`);
  formData.append("caption", `${date.format("dddd, MMMM D")}`);
  formData.append("chat_id", chat)
  formData.append("message_thread_id", thread)


  const request = new Request(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: formData
  })

  console.log(request)

  const response = await fetch(request);

  console.log(response)
}
