import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";

//add formatting plugins
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

/**
 * Gets humanized values of the time that has passed since like,
 * a few seconds ago, an hour ago, 2 days ago etc
 * @param timeInMilliseconds
 * @returns humanized string
 */
export function getHumanizedTime(timeInMilliseconds: number): string {
  return dayjs.duration(timeInMilliseconds, "milliseconds").humanize();
}

/**
 * Gets readable date in the given format
 * @param date
 * @param formatString
 * @returns readable date in format
 */
export function getReadableDateInFormat(
  date: Date,
  formatString: string,
): string {
  return dayjs(date).format(formatString);
}

export { dayjs };
