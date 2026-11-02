const dayjs = require("dayjs");

// A day of the current month that is never today: the 15th, or the 16th when today is the 15th.
// A date-picker spec that needs "a date other than today" uses it instead of today + N days. A calendar opens on the
// current month, so this day is always shown as a day of that month, whatever the date the spec runs on. Today + 1
// was not: on the last day of a month it is in the next month, and on 31 October 2026 (a Saturday) it was not on
// screen at all.
export function otherDayThisMonth() {
  const today = dayjs();

  return today.date(today.date() === 15 ? 16 : 15).startOf("day");
}
