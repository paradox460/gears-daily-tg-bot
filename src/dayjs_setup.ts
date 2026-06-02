import dayjs from "npm:dayjs@1.11.13";
import utc from "npm:dayjs@1.11.13/plugin/utc.js";

dayjs.extend(utc);

export default dayjs;
