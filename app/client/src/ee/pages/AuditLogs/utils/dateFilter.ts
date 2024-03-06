import moment from "moment";
import type { DateRange } from "@blueprintjs/datetime/src/common/dateRange";
import { initialAuditLogsDateFilter as initial } from "@appsmith/reducers/auditLogsReducer";

const getStartOfDayUnix = (date: Date) => {
  return moment(date).startOf("day").unix() * 1000;
};
const getEndOfDayUnix = (date: Date) => {
  return moment(date).endOf("day").unix() * 1000;
};
export const parseDateFilterInput = ([start, end]: DateRange): [
  number,
  number,
] => {
  /* By default, we will set the initial date value for start and end
   *
   * We need to parse the dates into unix milliseconds
   * for startDate, it will always be the start of the day selected
   * for endDate, it will always be the end of the day selected
   * This will ensure minimum range selected is at least 1 day
   * and will also capture a full day for larger ranges
   *
   * if no end/start date is provided and start/end date is selected,
   * we need to default the null value to the same day
   *
   */

  let startDate = initial.startDate;
  let endDate = initial.endDate;

  if (start !== null) {
    startDate = getStartOfDayUnix(start);
  }

  if (end !== null) {
    endDate = getEndOfDayUnix(end);
  }

  return [startDate, endDate];
};
