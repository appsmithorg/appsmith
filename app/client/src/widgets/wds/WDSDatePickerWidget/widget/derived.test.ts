import moment from "moment";
import derived from "./derived";

describe("isValid function", () => {
  const mockMoment = (date: string) => moment(date);

  it("should return true when isDirty is false", () => {
    const props = { isDirty: false };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate is null and not required", () => {
    const props = { isDirty: true, isRequired: false, selectedDate: null };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return false when selectedDate is null and required", () => {
    const props = { isDirty: true, isRequired: true, selectedDate: null };

    expect(derived.isValid(props, mockMoment)).toBe(false);
  });

  it("should return true when selectedDate is between minDate and maxDate", () => {
    const props = {
      isDirty: true,
      minDate: "2023-01-01",
      maxDate: "2023-12-31",
      selectedDate: "2023-06-15",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate equals minDate", () => {
    const props = {
      isDirty: true,
      minDate: "2023-01-01",
      selectedDate: "2023-01-01",
      timePrecision: "day",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate equals maxDate", () => {
    const props = {
      isDirty: true,
      maxDate: "2023-12-31",
      selectedDate: "2023-12-31",
      timePrecision: "day",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate equals both minDate and maxDate", () => {
    const props = {
      isDirty: true,
      minDate: "2023-06-15",
      maxDate: "2023-06-15",
      selectedDate: "2023-06-15",
      timePrecision: "day",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return false when selectedDate is before minDate", () => {
    const props = {
      isDirty: true,
      minDate: "2023-01-01",
      selectedDate: "2022-12-31",
    };

    expect(derived.isValid(props, mockMoment)).toBe(false);
  });

  it("should return false when selectedDate is after maxDate", () => {
    const props = {
      isDirty: true,
      maxDate: "2023-12-31",
      selectedDate: "2024-01-01",
    };

    expect(derived.isValid(props, mockMoment)).toBe(false);
  });

  it("should respect the configured time precision", () => {
    const props = {
      isDirty: true,
      minDate: "2023-06-15T10:00:00",
      selectedDate: "2023-06-15T10:30:00",
      timePrecision: "hour",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should accept a selected date on the maximum date in the local timezone", () => {
    const maxDate = "2023-01-01";
    const selectedDate = mockMoment(maxDate).hour(12).toISOString();

    const props = {
      isDirty: true,
      maxDate,
      selectedDate,
      timePrecision: "day",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate is valid and no min/max dates are set", () => {
    const props = {
      isDirty: true,
      selectedDate: "2023-06-15",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });
});
