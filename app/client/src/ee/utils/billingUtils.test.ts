import { getDateString, getRemainingDaysFromTimestamp } from "./billingUtils";

describe("CommonUtils", () => {
  describe("getDateString", () => {
    it("should return formatted date string", () => {
      const timestamp = new Date(2022, 0, 1).getTime();
      expect(getDateString(timestamp)).toEqual("1st Jan 2022");
    });

    it("should return 'Not available' if timestamp is undefined", () => {
      expect(getDateString(undefined)).toEqual("Not available");
    });
  });

  describe("getRemainingDaysFromTimestamp", () => {
    it("returns '30 days' for total hours less than or equal to 720 and more than 708", () => {
      const timeStamp = Date.now() + 1000 * 60 * 60 * 719;
      expect(getRemainingDaysFromTimestamp(timeStamp)).toEqual({
        days: 30,
        suffix: "days",
      });
    });

    it("returns '29 days' for total hours less than 708", () => {
      const timeStamp = Date.now() + 1000 * 60 * 60 * 707;
      expect(getRemainingDaysFromTimestamp(timeStamp)).toEqual({
        days: 29,
        suffix: "days",
      });
    });

    it("returns the number of hours for total hours greater than 12 hours", () => {
      const timeStamp = Date.now() + 1000 * 60 * 60 * 13;
      expect(getRemainingDaysFromTimestamp(timeStamp)).toEqual({
        days: 1,
        suffix: "day",
      });
    });

    it("returns the number of days for total hours greater than 12", () => {
      const timeStamp = Date.now() + 1000 * 60 * 60 * 2;
      expect(getRemainingDaysFromTimestamp(timeStamp)).toEqual({
        days: 2,
        suffix: "hours",
      });
    });

    it("returns the number of days for total hours greater than 12", () => {
      const timeStamp = Date.now() + 1000 * 60 * 60;
      expect(getRemainingDaysFromTimestamp(timeStamp)).toEqual({
        days: 1,
        suffix: "hour",
      });
    });
  });
});
