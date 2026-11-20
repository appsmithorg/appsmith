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

  it("should return true when selectedDate is valid and no min/max dates are set", () => {
    const props = {
      isDirty: true,
      selectedDate: "2023-06-15",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate equals minDate with both minDate and maxDate set", () => {
    const props = {
      isDirty: true,
      minDate: "2023-01-01",
      maxDate: "2023-12-31",
      selectedDate: "2023-01-01",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate equals maxDate with both minDate and maxDate set", () => {
    const props = {
      isDirty: true,
      minDate: "2023-01-01",
      maxDate: "2023-12-31",
      selectedDate: "2023-12-31",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate equals minDate (only minDate set)", () => {
    const props = {
      isDirty: true,
      minDate: "2023-01-01",
      selectedDate: "2023-01-01",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should return true when selectedDate equals maxDate (only maxDate set)", () => {
    const props = {
      isDirty: true,
      maxDate: "2023-12-31",
      selectedDate: "2023-12-31",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
  });

  it("should respect timePrecision day granularity on boundary dates with different time components", () => {
    const props = {
      isDirty: true,
      timePrecision: "day",
      minDate: "2023-01-01T14:30:00",
      maxDate: "2023-12-31T08:00:00",
      selectedDate: "2023-01-01T00:00:00",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
    expect(
      derived.isValid(
        { ...props, selectedDate: "2023-12-31T23:59:59" },
        mockMoment,
      ),
    ).toBe(true);
  });

  it("should treat date-only bounds consistently with local selectedDate timestamps", () => {
    const props = {
      isDirty: true,
      timePrecision: "day",
      minDate: "2023-01-01",
      maxDate: "2023-12-31",
      selectedDate: "2023-01-01T23:59:59",
    };

    expect(derived.isValid(props, mockMoment)).toBe(true);
    expect(
      derived.isValid(
        { ...props, selectedDate: "2023-12-31T23:59:59" },
        mockMoment,
      ),
    ).toBe(true);
  });
});
