import moment from "moment";
import { DateRange } from "@blueprintjs/datetime/src/common/dateRange";
import { initialAuditLogsDateFilter } from "@appsmith/reducers/auditLogsReducer";

export const getStartOfDayUnix = (date: Date) => {
  return (
    moment(date)
      .startOf("day")
      .unix() * 1000
  );
};
export const getEndOfDayUnix = (date: Date) => {
  return (
    moment(date)
      .endOf("day")
      .unix() * 1000
  );
};
export const parseDateFilterInput = ([
  inputStartDate,
  inputEndDate,
]: DateRange): [number, number] => {
  /* By default, we will set the initial date value for start and end
   *
   * We need to parse the dates into unix milliseconds
   * for startDate, it will always be the start of the day selected
   * for endDate, it will always be the end of the dat selected
   * This will ensure minimum range selected is at least 1 day
   * and will also capture a full day for larger ranges
   *
   * if no end/start date is provided and start/end date is selected,
   * we need to default the null value to the same day
   *
   */

  let startDate = initialAuditLogsDateFilter.startDate;
  let endDate = initialAuditLogsDateFilter.endDate;

  if (inputStartDate === null) {
    if (inputEndDate !== null) {
      startDate = getStartOfDayUnix(inputEndDate);
    }
  } else {
    startDate = getStartOfDayUnix(inputStartDate);
  }

  if (inputEndDate === null) {
    if (inputStartDate !== null) {
      endDate = getEndOfDayUnix(inputStartDate);
    }
  } else {
    endDate = getEndOfDayUnix(inputEndDate);
  }

  return [startDate, endDate];
};
