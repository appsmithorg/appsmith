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

    const isValid = true;

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(isValid);
  });

  it("selectedDate is out of bounds", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2021-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2022-12-01T05:49:24.753Z",
    };

    const isValid = false;

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(isValid);
  });

  it("selectedDate is invalid or not selected", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "",
    };

    const isValid = false;

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(isValid);
  });

  it("isRequired is disabled", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: false,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2021-12-01T05:49:24.753Z",
    };

    const isValid = true;

    let result = isValidDate(input, moment, _);
    expect(result).toStrictEqual(isValid);
  });
});
