import moment from "moment";

export const parseDate = (dateStr: string, dateFormat: string): Date => {
  const date = moment(dateStr, dateFormat);
  if (date.isValid()) return date.toDate();
  else return moment().toDate();
};
