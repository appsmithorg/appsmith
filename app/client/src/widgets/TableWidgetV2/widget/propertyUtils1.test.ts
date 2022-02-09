import {
  totalRecordsCountValidation,
  uniqueColumnNameValidation,
  updateColumnStyles,
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

  it("updateColumnStyles shoudl test with all possible values", () => {
    let props: any = {
      primaryColumns: {
        1: {
          id: 1,
          style: "someRandomStyleValue",
        },
        2: {
          id: 2,
          style: "someRandomStyleValue",
        },
        3: {
          id: 3,
          style: "someRandomStyleValue",
        },
      },
    };

    expect(
      updateColumnStyles(
        (props as any) as TableWidgetProps,
        "style",
        "someOtherRandomStyleValue",
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.1.style",
        propertyValue: "someOtherRandomStyleValue",
      },
      {
        propertyPath: "primaryColumns.2.style",
        propertyValue: "someOtherRandomStyleValue",
      },
      {
        propertyPath: "primaryColumns.3.style",
        propertyValue: "someOtherRandomStyleValue",
      },
    ]);

    props = {
      dynamicBindingPathList: [
        {
          key: "primaryColumns.3.style",
        },
      ],
      primaryColumns: {
        1: {
          id: 1,
          style: "someRandomStyleValue",
        },
        2: {
          id: 2,
          style: "someRandomStyleValue",
        },
        3: {
          id: 3,
          style: "someRandomStyleValue",
        },
      },
    };

    expect(
      updateColumnStyles(
        (props as any) as TableWidgetProps,
        "style",
        "someOtherRandomStyleValue",
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.1.style",
        propertyValue: "someOtherRandomStyleValue",
      },
      {
        propertyPath: "primaryColumns.2.style",
        propertyValue: "someOtherRandomStyleValue",
      },
    ]);

    expect(
      updateColumnStyles(
        (props as any) as TableWidgetProps,
        "",
        "someOtherRandomStyleValue",
      ),
    ).toEqual(undefined);

    expect(
      updateColumnStyles(
        ({} as any) as TableWidgetProps,
        "style",
        "someOtherRandomStyleValue",
      ),
    ).toEqual(undefined);

    expect(
      updateColumnStyles(
        ({} as any) as TableWidgetProps,
        "",
        "someOtherRandomStyleValue",
      ),
    ).toEqual(undefined);
  });
});
