import { getNewDailies } from "./gears.ts";
import { sendPhoto } from "./telegram.ts";

const dailies = await getNewDailies().then((images) =>
  images.sort(({ date: a }, { date: b }) => a.isAfter(b) ? 1 : -1)
);
for await (const daily of dailies) {
  await sendPhoto(daily);
}
