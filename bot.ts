import dayjs from "./dayjs_setup.ts";
import { dailyForDate } from "./gears.ts";
import { sendDaily } from "./telegram.ts";

const day = dayjs.utc().hour(19);
const daily = dailyForDate(day);

sendDaily(daily, day);
