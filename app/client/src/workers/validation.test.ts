import { validateDateString } from "./validations";

describe("validateDateString test", () => {
  it("Check whether the valid date strings are recognized as valid", () => {
    const validDateStrings = [
      {
        date: "2021-03-12T07:13:03.046Z",
        format: "",
        version: 2,
      },
      {
        date: "2021-03-12",
        format: "YYYY-MM-DD",
        version: 1,
      },
    ];

    validDateStrings.forEach((item) => {
      expect(
        validateDateString(item.date, item.format, item.version),
      ).toBeTruthy();
    });
  });

  it("Check whether the invalid date strings are recognized as invalid", () => {
    const inValidDateStrings = [
      {
        date: "2021-13-12T07:13:03.046Z",
        format: "",
        version: 2,
      },
      {
        date: "2021-13-12",
        format: "YYYY-MM-DD",
        version: 1,
      },
    ];

    inValidDateStrings.forEach((item) => {
      expect(
        validateDateString(item.date, item.format, item.version),
      ).toBeFalsy();
    });
  });
});
