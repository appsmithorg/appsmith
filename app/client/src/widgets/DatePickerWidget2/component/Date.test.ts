import moment from "moment-timezone";
import { DateFormatOptions } from "./constants";
import { parseDate } from "./utils";

describe("DatePickerWidget", () => {
  it("should parse date strings correctly according to date formats", () => {
    DateFormatOptions.forEach((format) => {
      const testDate = new Date(2000000000000); // let's enter into the future
      const testDateStr = moment(testDate).format(format.value);
      const parsedDate = parseDate(testDateStr, format.value);
      expect(parsedDate.getFullYear()).toBe(testDate.getFullYear());
      expect(parsedDate.getUTCMonth()).toBe(testDate.getUTCMonth());
      expect(parsedDate.getDate()).toBe(testDate.getDate());
    });
  });
});
