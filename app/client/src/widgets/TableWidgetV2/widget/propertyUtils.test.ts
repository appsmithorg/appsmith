import {
  totalRecordsCountValidation,
  uniqueColumnNameValidation,
  updateColumnStyles,
  updateColumnOrderHook,
  getBasePropertyPath,
  hideByColumnType,
  uniqueColumnAliasValidation,
} from "./propertyUtils";
import _ from "lodash";
import { ColumnTypes, TableWidgetProps } from "../constants";

describe("PropertyUtils - ", () => {
  it("totalRecordsCountValidation - should test with all possible values", () => {
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

  it("uniqueColumnNameValidation - should test with all possible values", () => {
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

  it("updateColumnStyles - should test with all possible values", () => {
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

  it("updateColumnOrderHook - should test with all possible values", () => {
    expect(
      updateColumnOrderHook(
        ({
          columnOrder: ["column1", "columns2"],
        } as any) as TableWidgetProps,
        "primaryColumns.column3",
        {
          id: "column3",
        },
      ),
    ).toEqual([
      {
        propertyPath: "columnOrder",
        propertyValue: ["column1", "columns2", "column3"],
      },
      {
        propertyPath: "primaryColumns.column3",
        propertyValue: {
          id: "column3",
          labelColor: "#FFFFFF",
        },
      },
    ]);

    expect(
      updateColumnOrderHook(
        ({
          columnOrder: ["column1", "columns2"],
        } as any) as TableWidgetProps,
        "",
        {
          id: "column3",
        },
      ),
    ).toEqual(undefined);

    expect(
      updateColumnOrderHook(({} as any) as TableWidgetProps, "", {
        id: "column3",
      }),
    ).toEqual(undefined);

    expect(
      updateColumnOrderHook(
        ({
          columnOrder: ["column1", "columns2"],
        } as any) as TableWidgetProps,
        "primaryColumns.column3.iconAlignment",
        {
          id: "column3",
        },
      ),
    ).toEqual(undefined);
  });

  it("getBasePropertyPath - should test with all possible values", () => {
    expect(getBasePropertyPath("primaryColumns.test")).toBe("primaryColumns");
    expect(getBasePropertyPath("primaryColumns.test.style")).toBe(
      "primaryColumns.test",
    );
    expect(getBasePropertyPath("")).toBe(undefined);
    expect(getBasePropertyPath("primaryColumns")).toBe(undefined);
  });

  describe("hideByColumnType - ", () => {
    it("should test with column type that should not be hidden", () => {
      const prop = {
        primaryColumns: {
          column: {
            columnType: "text",
          },
        },
      };

      expect(
        hideByColumnType(
          (prop as any) as TableWidgetProps,
          "primaryColumns.column",
          ["text"] as ColumnTypes[],
          true,
        ),
      ).toBe(false);
    });

    it("should test with column type that should be hidden", () => {
      const prop = {
        primaryColumns: {
          column: {
            columnType: "select",
          },
        },
      };

      expect(
        hideByColumnType(
          (prop as any) as TableWidgetProps,
          "primaryColumns.column",
          ["text"] as ColumnTypes[],
          true,
        ),
      ).toBe(true);
    });

    it("should test column that should be hidden, with full propertyPath", () => {
      const prop = {
        primaryColumns: {
          column: {
            columnType: "select",
          },
        },
      };

      expect(
        hideByColumnType(
          (prop as any) as TableWidgetProps,
          "primaryColumns.column.buttonColor",
          (["Button"] as any) as ColumnTypes[],
        ),
      ).toBe(true);
    });

    it("should test column that should not be hidden, with full propertyPath", () => {
      const prop = {
        primaryColumns: {
          column: {
            columnType: "Button",
          },
        },
      };

      expect(
        hideByColumnType(
          (prop as any) as TableWidgetProps,
          "primaryColumns.column.buttonColor",
          (["Button"] as any) as ColumnTypes[],
        ),
      ).toBe(false);
    });
  });
});

describe("uniqueColumnAliasValidation", () => {
  it("should validate that duplicate value is not allowed", () => {
    expect(
      uniqueColumnAliasValidation(
        "column",
        ({
          primaryColumns: {
            column: {
              alias: "column",
            },
            column1: {
              alias: "column",
            },
            column2: {
              alias: "column2",
            },
          },
        } as unknown) as TableWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: "column",
      messages: ["Property names should be unique."],
    });
  });

  it("should validate that empty value is not allowed", () => {
    expect(
      uniqueColumnAliasValidation(
        "",
        ({
          primaryColumns: {
            column: {
              alias: "column",
            },
            column1: {
              alias: "column1",
            },
            column2: {
              alias: "column2",
            },
          },
        } as unknown) as TableWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: "",
      messages: ["Property name should not be empty."],
    });
  });

  it("should validate that unique value is allowed", () => {
    expect(
      uniqueColumnAliasValidation(
        "column1",
        ({
          primaryColumns: {
            column: {
              alias: "column",
            },
            column1: {
              alias: "column1",
            },
            column2: {
              alias: "column2",
            },
          },
        } as unknown) as TableWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: "column1",
      messages: [""],
    });
  });
});
