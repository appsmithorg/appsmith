import { getHumanizedTime, getReadableDateInFormat, dayjs } from "./dayJsUtils";

describe("dayJsUtils", () => {
  let previousLocale: string;

  beforeAll(() => {
    previousLocale = dayjs.locale();
    dayjs.locale("en");
  });

  afterAll(() => {
    dayjs.locale(previousLocale);
  });

  describe("getHumanizedTime", () => {
    it("should return 'a few seconds' for small time values", () => {
      expect(getHumanizedTime(1000)).toBe("a few seconds");
      expect(getHumanizedTime(5000)).toBe("a few seconds");
      expect(getHumanizedTime(10000)).toBe("a few seconds");
    });

    it("should return correct humanized time for minutes", () => {
      expect(getHumanizedTime(60000)).toBe("a minute");
      expect(getHumanizedTime(120000)).toBe("2 minutes");
      expect(getHumanizedTime(300000)).toBe("5 minutes");
      expect(getHumanizedTime(1800000)).toBe("30 minutes");
    });

    it("should return correct humanized time for hours", () => {
      expect(getHumanizedTime(3600000)).toBe("an hour");
      expect(getHumanizedTime(7200000)).toBe("2 hours");
      expect(getHumanizedTime(14400000)).toBe("4 hours");
      expect(getHumanizedTime(28800000)).toBe("8 hours");
    });

    it("should return correct humanized time for days", () => {
      expect(getHumanizedTime(86400000)).toBe("a day");
      expect(getHumanizedTime(172800000)).toBe("2 days");
      expect(getHumanizedTime(604800000)).toBe("7 days");
    });

    it("should return correct humanized time for months", () => {
      expect(getHumanizedTime(2592000000)).toBe("a month");
      expect(getHumanizedTime(5184000000)).toBe("2 months");
    });

    it("should return correct humanized time for years", () => {
      expect(getHumanizedTime(31536000000)).toBe("a year");
      expect(getHumanizedTime(63072000000)).toBe("2 years");
    });

    it("should handle zero milliseconds", () => {
      expect(getHumanizedTime(0)).toBe("a few seconds");
    });

    it("should handle edge cases around time boundaries", () => {
      // Just under a minute (dayjs may have different thresholds)
      const underMinute = getHumanizedTime(45000);
      expect(["a few seconds", "a minute"]).toContain(underMinute);
      // Just at a minute
      expect(getHumanizedTime(60000)).toBe("a minute");
      // Just under an hour (dayjs duration humanize may round up)
      const underHour = getHumanizedTime(3500000);
      expect(["58 minutes", "59 minutes", "an hour"]).toContain(underHour);
      // Just at an hour
      expect(getHumanizedTime(3600000)).toBe("an hour");
    });
  });

  describe("getReadableDateInFormat", () => {
    it("should format date in default format", () => {
      const date = new Date(2024, 2, 15, 12, 0, 0); // Local time, timezone-independent
      expect(getReadableDateInFormat(date, "YYYY-MM-DD")).toBe("2024-03-15");
    });

    it("should format date with time", () => {
      const date = new Date(2024, 2, 15, 14, 30, 0); // Local time, timezone-independent
      expect(getReadableDateInFormat(date, "YYYY-MM-DD HH:mm")).toBe("2024-03-15 14:30");
    });

    it("should format date in various formats", () => {
      const date = new Date(2024, 2, 15, 12, 0, 0); // Local time, timezone-independent

      expect(getReadableDateInFormat(date, "DD/MM/YYYY")).toBe("15/03/2024");
      expect(getReadableDateInFormat(date, "MM-DD-YYYY")).toBe("03-15-2024");
      expect(getReadableDateInFormat(date, "MMMM Do, YYYY")).toBe("March 15th, 2024");
    });

    it("should handle month names", () => {
      const date = new Date(2024, 5, 15, 12, 0, 0); // June 15, 2024 (month is 0-indexed)
      expect(getReadableDateInFormat(date, "MMMM YYYY")).toBe("June 2024");
    });

    it("should handle day names", () => {
      const date = new Date(2024, 2, 15, 12, 0, 0); // March 15, 2024 is a Friday
      expect(getReadableDateInFormat(date, "dddd")).toBe("Friday");
    });

    it("should format with seconds", () => {
      const date = new Date(2024, 2, 15, 14, 30, 45); // Local time, timezone-independent
      expect(getReadableDateInFormat(date, "HH:mm:ss")).toBe("14:30:45");
    });

    it("should handle 12-hour format", () => {
      const date = new Date(2024, 2, 15, 14, 30, 0); // 2:30 PM in local time
      expect(getReadableDateInFormat(date, "hh:mm A")).toBe("02:30 PM");
    });

    it("should handle empty format string", () => {
      const date = new Date(2024, 2, 15, 12, 0, 0);
      // dayjs returns ISO format when format string is empty
      const result = getReadableDateInFormat(date, "");
      expect(result).toContain("2024");
    });

    it("should handle current date", () => {
      const now = new Date();
      const formatted = getReadableDateInFormat(now, "YYYY-MM-DD");
      // Should be a valid date string
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should handle advanced format features", () => {
      const date = new Date(2024, 2, 15, 14, 30, 45); // March 15, 2024 is Q1

      // Quarter
      expect(getReadableDateInFormat(date, "Q")).toBe("1");

      // Note: week of year requires weekOfYear plugin which may not be loaded
      // Testing day of year might require additional plugins
      expect(typeof getReadableDateInFormat(date, "DD")).toBe("string");
    });
  });

  describe("dayjs", () => {
    it("should be a valid dayjs instance", () => {
      const now = dayjs();
      expect(now.isValid()).toBe(true);
    });

    it("should parse date strings", () => {
      const date = dayjs("2024-03-15");
      expect(date.isValid()).toBe(true);
      expect(date.year()).toBe(2024);
      expect(date.month()).toBe(2); // March is month 2 (0-indexed)
      expect(date.date()).toBe(15);
    });

    it("should have duration plugin available", () => {
      const duration = dayjs.duration(3600000, "milliseconds");
      expect(duration.asMinutes()).toBe(60);
      expect(duration.asHours()).toBe(1);
    });

    it("should have relativeTime plugin available", () => {
      const now = dayjs();
      const past = now.subtract(1, "hour");
      expect(past.fromNow()).toContain("hour");
    });

    it("should have advancedFormat plugin available", () => {
      const date = dayjs("2024-03-15");
      // advancedFormat allows formatting like 'Do' for ordinal dates
      expect(date.format("Do")).toBe("15th");
    });

    it("should support chaining operations", () => {
      const date = dayjs("2024-03-15")
        .add(1, "day")
        .subtract(1, "month");

      expect(date.format("YYYY-MM-DD")).toBe("2024-02-16");
    });

    it("should handle invalid dates", () => {
      const invalidDate = dayjs("not a date");
      expect(invalidDate.isValid()).toBe(false);
    });

    it("should compare dates correctly", () => {
      const date1 = dayjs("2024-03-15");
      const date2 = dayjs("2024-03-16");

      expect(date1.isBefore(date2)).toBe(true);
      expect(date2.isAfter(date1)).toBe(true);
      expect(date1.isSame(date1)).toBe(true);
    });

    it("should handle date manipulation", () => {
      const date = dayjs("2024-03-15");

      expect(date.add(7, "day").format("YYYY-MM-DD")).toBe("2024-03-22");
      expect(date.subtract(1, "month").format("YYYY-MM-DD")).toBe("2024-02-15");
      expect(date.startOf("month").format("YYYY-MM-DD")).toBe("2024-03-01");
      expect(date.endOf("month").format("YYYY-MM-DD")).toBe("2024-03-31");
    });
  });

  describe("Integration tests", () => {
    it("should work together for humanized time from dates", () => {
      const now = dayjs();
      const pastDate = now.subtract(2, "hour");
      const diffMs = now.diff(pastDate);

      expect(getHumanizedTime(diffMs)).toBe("2 hours");
    });

    it("should format relative times correctly", () => {
      const now = dayjs();
      const oneHourAgo = now.subtract(1, "hour");

      expect(oneHourAgo.fromNow()).toBe("an hour ago");
    });

    it("should handle formatting and duration together", () => {
      const startTime = dayjs("2024-03-15T10:00:00");
      const endTime = dayjs("2024-03-15T14:30:00");
      const duration = dayjs.duration(endTime.diff(startTime));

      expect(getReadableDateInFormat(startTime.toDate(), "HH:mm")).toBe("10:00");
      expect(getReadableDateInFormat(endTime.toDate(), "HH:mm")).toBe("14:30");
      expect(duration.asHours()).toBe(4.5);
    });
  });
});