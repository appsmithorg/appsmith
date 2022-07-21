import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";

describe("Validates Derived Properties", () => {
  it("selectedDate is between min and max dates", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2021-12-01T05:49:24.753Z",
    };

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(true);
  });

  it("selectedDate is out of bounds", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2021-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2022-12-01T05:49:24.753Z",
    };

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(false);
  });

  it("isRequired is enabled and date is not selected", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "",
    };

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(false);
  });

  it("isRequired is disabled and date is selected", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: false,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2021-12-01T05:49:24.753Z",
    };

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(true);
  });

  it("isRequired is disabled and date is not selected", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: false,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "",
    };

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(true);
  });

  it("isRequired is disabled and date is not between min and max", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: false,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2122-12-31T18:29:00.000Z",
    };

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(false);
  });
});
