import dayjs from "./dayjs_setup.ts";
import { dailyForDate } from "./gears.ts";
import { sendDaily } from "./telegram.ts";
import getConfig from "./config.ts";

const config = getConfig();

const day = dayjs.utc().hour(19).add(config.offset || 0, "day");
const daily = dailyForDate(day);

sendDaily(daily, day);
