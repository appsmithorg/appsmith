import {
  totalRecordsCountValidation,
  uniqueColumnNameValidation,
} from "./propertyUtils";
import _ from "lodash";
import { TableWidgetProps } from "../constants";

describe("PropertyUtils - ", () => {
  it("totalRecordsCountValidation should test with all possible values", () => {
    const ERROR_MESSAGE = "This value must be a number";

    const values = [
      [
        undefined,
        {
          isValid: true,
          parsed: 0,
          message: [""],
        },
      ],
      [
        null,
        {
          isValid: true,
          parsed: 0,
          message: [""],
        },
      ],
      [
        "",
        {
          isValid: true,
          parsed: 0,
          message: [""],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: 0,
          message: [ERROR_MESSAGE],
        },
      ],
      [
        [],
        {
          isValid: false,
          parsed: 0,
          message: [ERROR_MESSAGE],
        },
      ],
      [
        "test",
        {
          isValid: false,
          parsed: 0,
          message: [ERROR_MESSAGE],
        },
      ],
      [
        "1",
        {
          isValid: true,
          parsed: 1,
          message: [""],
        },
      ],
      [
        1,
        {
          isValid: true,
          parsed: 1,
          message: [""],
        },
      ],
    ];

    values.forEach(([input, expected]) => {
      expect(
        totalRecordsCountValidation(input, {} as TableWidgetProps, _),
      ).toEqual(expected);
    });
  });

  it("uniqueColumnNameValidation should test with all possible values", () => {
    let value = [
      {
        label: "column1",
      },
      {
        label: "column2",
      },
      {
        label: "column3",
      },
    ];

    expect(
      uniqueColumnNameValidation(value, {} as TableWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: value,
      messages: [""],
    });

    value = [
      {
        label: "column1",
      },
      {
        label: "column2",
      },
      {
        label: "column1",
      },
    ];

    expect(
      uniqueColumnNameValidation(value, {} as TableWidgetProps, _),
    ).toEqual({
      isValid: false,
      parsed: value,
      messages: ["Column names should be unique."],
    });
  });
});
