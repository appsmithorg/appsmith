import {
  toDate,
  toDropdownOption,
  toEvent,
  toUserEmail,
} from "./toDropdownOption";

describe("audit-logs/utils/toDropdownOption", () => {
  describe("toDate", () => {
    it("returns empty object when input is empty string", () => {
      const actual = toDate("");
      const expected = {};
      expect(actual).toEqual(expected);
    });
    it("returns default value for unknown input", () => {
      const actual = toDate("-1");
      const expected = { label: "Select", value: "0", key: "no-value" };
      expect(actual).toEqual(expected);
    });
    it("returns default value for input=0", () => {
      const actual = toDate("0");
      const expected = { label: "Select", value: "0", key: "no-value" };
      expect(actual).toEqual(expected);
    });
    it("returns correct value for input=1", () => {
      const actual = toDate("1");
      const expected = { label: "Today", value: "1", key: "today" };
      expect(actual).toEqual(expected);
    });
    it("returns correct value for input=2", () => {
      const actual = toDate("2");
      const expected = { label: "Yesterday", value: "2", key: "yesterday" };
      expect(actual).toEqual(expected);
    });
    it("returns correct value for input=8", () => {
      const actual = toDate("8");
      const expected = { label: "Last 7 days", value: "8", key: "last-7" };
      expect(actual).toEqual(expected);
    });
    it("returns correct value for input=31", () => {
      const actual = toDate("31");
      const expected = { label: "Last 30 days", value: "31", key: "last-30" };
      expect(actual).toEqual(expected);
    });
  });

  describe("toEvent", () => {
    it("returns empty object when input is empty string", () => {
      const actual = toEvent("");
      const expected = {};
      expect(actual).toEqual(expected);
    });
    it("returns default value when input doesn't have a dot", () => {
      const actual = toEvent("random");
      const expected = { label: "random", value: "random", key: "random" };
      expect(actual).toEqual(expected);
    });
    it("returns correct value when input has a dot", () => {
      const actual = toEvent("page.created");
      const expected = {
        label: "Page created",
        value: "page.created",
        key: "page.created",
      };
      expect(actual).toEqual(expected);
    });
  });

  describe("toDropdownOption", () => {
    it("returns empty object when input is empty string", () => {
      const actual = toDropdownOption("");
      const expected = {};
      expect(actual).toEqual(expected);
    });
    it("returns correct value", () => {
      const actual = toDropdownOption("random");
      const expected = { label: "random", value: "random", key: "random" };
      expect(actual).toEqual(expected);
    });
  });

  describe("toUserEmail", () => {
    it("returns empty object when input is empty string", () => {
      const actual = toUserEmail("");
      const expected = {};
      expect(actual).toEqual(expected);
    });
    it("returns correct value", () => {
      const actual = toUserEmail("random");
      const expected = { label: "random", value: "random", key: "random" };
      expect(actual).toEqual(expected);
    });
  });
});
