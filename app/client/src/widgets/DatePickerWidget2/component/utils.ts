// import moment from "moment";
import dayjs from "dayjs";

export const parseDate = (dateStr: string, dateFormat: string): Date => {
  const date = dayjs(dateStr, dateFormat);
  if (date.isValid()) return date.toDate();
  else return dayjs().toDate();
};
