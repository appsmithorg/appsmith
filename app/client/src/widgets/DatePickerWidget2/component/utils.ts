import { parse, isValid } from "date-fns";

export const parseDate = (dateStr: string, dateFormat: string): Date => {
  try {
    const date = parse(dateStr, dateFormat, new Date());
    if (isValid(date)) return date;
  } catch (e) {
    // Invalid date format
  }
  return new Date();
};
