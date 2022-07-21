import moment from "moment";
import { DateFormatOptions } from "../widget/constants";
import { parseDate } from "./utils";

describe("DatePickerWidget", () => {
  it("should parse date strings correctly according to date formats", () => {
    const testDate = new Date(2000000000000); // let's enter into the future

    DateFormatOptions.forEach((format) => {
      const testDateStr = moment(testDate).format(format.value);
      const parsedDate = parseDate(testDateStr, format.value);
      const receivedDate = moment(testDateStr, format.value).toDate();

      expect(parsedDate.getFullYear()).toBe(receivedDate.getFullYear());
      expect(parsedDate.getUTCMonth()).toBe(receivedDate.getUTCMonth());
      expect(parsedDate.getDate()).toBe(receivedDate.getDate());
      expect(parsedDate.getHours()).toBe(receivedDate.getHours());
      expect(parsedDate.getMinutes()).toBe(receivedDate.getMinutes());
      expect(parsedDate.getSeconds()).toBe(receivedDate.getSeconds());
      expect(parsedDate.getMilliseconds()).toBe(receivedDate.getMilliseconds());
    });
  });
});
