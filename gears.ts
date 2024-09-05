import dayjs from "npm:dayjs@1.11.13";
import customParseFormat from "npm:dayjs@1.11.13/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);

function newPost(created_utc: number) {
  let last_run = dayjs.unix(0);
  try {
    last_run =  dayjs.unix(parseInt(Deno.readTextFileSync("./gears_bot_last_run")))
  } catch {
    console.log("last_run file doesn't exist, will be created later");
  }
  const created = dayjs.unix(created_utc);
  return created.isAfter(last_run);
}

function extractDateFromTitle(title: string) {
  const rawDate = title.match(/Daily Horde &amp; Escape - .*?, (.*?)$/i)?.[1] ??
    null;
  if (!rawDate) return null;
  return dayjs(rawDate, "MMMM D");
}

export interface ImageWithDate {
  image: Blob;
  date: dayjs.Dayjs;
}

export async function getNewDailies(): Promise<ImageWithDate[]> {
  console.log("getting posts")
  const data = await fetch(
    "https://www.reddit.com/user/drshwazzy92/submitted/.json",
  ).then((response) => response.json());

  const posts = data.data.children.filter(
    ({ kind, data } : {kind: string, data: {subreddit: string, title: string, created_utc: number}}) => {
      return kind == "t3" && data.subreddit == "GearsOfWar" && /Daily Horde &amp; Escape/i.test(data.title) && newPost(data.created_utc)
    })

  console.log(`filtered down to ${posts.length}`)

  const imageBlobs: ImageWithDate[] = [];

  console.log("downloading images")

  for await (const { data: {title, url } } of posts) {
    const date = extractDateFromTitle(title);
    if (!date) continue;
    imageBlobs.push({
      image: await fetch(url).then((response) => response.blob()),
      date: date,
    });
  }

  console.log("writing last run file")
  await Deno.writeTextFile("./gears_bot_last_run", dayjs().unix().toString());
  return imageBlobs;
}
