import { dailyForDate } from "./gears.ts";
import { sendDaily } from "./telegram.ts";
import getConfig from "./config.ts";

const config = getConfig();
const day = Temporal.Now.zonedDateTimeISO("UTC").with({ hour: 19 }).add({ days: config.offset || 0 });
const daily = dailyForDate(day);

sendDaily(daily, day);
