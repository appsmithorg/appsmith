import {
  totalRecordsCountValidation,
  uniqueColumnNameValidation,
  updateColumnStyles,
  updateColumnOrderHook,
  getBasePropertyPath,
  hideByColumnType,
  uniqueColumnAliasValidation,
  updateCustomColumnAliasOnLabelChange,
  selectColumnOptionsValidation,
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

describe("selectColumnOptionsValidation", () => {
  describe("- Array of label, values", () => {
    it("should check that for empty values are allowed", () => {
      ["", undefined, null].forEach((value) => {
        expect(
          selectColumnOptionsValidation(value, {} as TableWidgetProps, _),
        ).toEqual({
          isValid: true,
          parsed: [],
          messages: [""],
        });
      });
    });

    it("should check that value should be an array", () => {
      expect(
        selectColumnOptionsValidation("test", {} as TableWidgetProps, _),
      ).toEqual({
        isValid: false,
        parsed: [],
        messages: [
          `This value does not evaluate to type Array<{ "label": string | number, "value": string | number | boolean }>`,
        ],
      });

      expect(
        selectColumnOptionsValidation(1, {} as TableWidgetProps, _),
      ).toEqual({
        isValid: false,
        parsed: [],
        messages: [
          `This value does not evaluate to type Array<{ "label": string | number, "value": string | number | boolean }>`,
        ],
      });

      expect(
        selectColumnOptionsValidation([], {} as TableWidgetProps, _),
      ).toEqual({
        isValid: true,
        parsed: [],
        messages: [""],
      });
    });

    it("should check that value should be an array of objects", () => {
      expect(
        selectColumnOptionsValidation([1, 2], {} as TableWidgetProps, _),
      ).toEqual({
        isValid: false,
        parsed: [1, 2],
        messages: [
          `Invalid entry at index: 0. This value does not evaluate to type: { "label": string | number, "value": string | number | boolean }`,
        ],
      });
    });

    it("should check that each value should have label key", () => {
      expect(
        selectColumnOptionsValidation(
          [{ value: "1" }, { value: "2" }],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [{ value: "1" }, { value: "2" }],
        messages: [`Invalid entry at index: 0. Missing required key: label`],
      });
    });

    it("should check that each value should have value key", () => {
      expect(
        selectColumnOptionsValidation(
          [{ label: "1" }, { label: "2" }],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [{ label: "1" }, { label: "2" }],
        messages: [`Invalid entry at index: 0. Missing required key: value`],
      });
    });

    it("should check that each value should have unique value", () => {
      expect(
        selectColumnOptionsValidation(
          [
            { label: "1", value: "1" },
            { label: "2", value: "1" },
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [
          { label: "1", value: "1" },
          { label: "2", value: "1" },
        ],
        messages: [
          "Duplicate values found for the following properties, in the array entries, that must be unique -- value.",
        ],
      });
    });

    it("should check that array of label, value witn invalid values", () => {
      expect(
        selectColumnOptionsValidation(
          [{ label: "1", value: [] }],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [{ label: "1", value: [] }],
        messages: [
          "Invalid entry at index: 0. value does not evaluate to type string | number | boolean",
        ],
      });

      expect(
        selectColumnOptionsValidation(
          [{ label: true, value: "1" }],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [{ label: true, value: "1" }],
        messages: [
          "Invalid entry at index: 0. label does not evaluate to type string | number",
        ],
      });
    });

    it("should check that array of label, value is valid", () => {
      expect(
        selectColumnOptionsValidation(
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
        ],
        messages: [""],
      });

      expect(
        selectColumnOptionsValidation(
          [
            { label: "1", value: 1 },
            { label: "2", value: "2" },
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [
          { label: "1", value: 1 },
          { label: "2", value: "2" },
        ],
        messages: [""],
      });

      expect(
        selectColumnOptionsValidation(
          [
            { label: "1", value: true },
            { label: "2", value: "2" },
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [
          { label: "1", value: true },
          { label: "2", value: "2" },
        ],
        messages: [""],
      });

      expect(
        selectColumnOptionsValidation(
          [
            { label: 1, value: true },
            { label: "2", value: "2" },
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [
          { label: 1, value: true },
          { label: "2", value: "2" },
        ],
        messages: [""],
      });
    });
  });

  describe("- Array of Array of label, values", () => {
    it("should check that value should be an array of arrays", () => {
      expect(
        selectColumnOptionsValidation([[1, 2], 1], {} as TableWidgetProps, _),
      ).toEqual({
        isValid: false,
        parsed: [],
        messages: [
          `This value does not evaluate to type Array<{ "label": string | number, "value": string | number | boolean }>`,
        ],
      });
    });

    it("should check that value should be an array of arrays of object", () => {
      expect(
        selectColumnOptionsValidation([[1, 2]], {} as TableWidgetProps, _),
      ).toEqual({
        isValid: false,
        parsed: [[1, 2]],
        messages: [
          `Invalid entry at Row: 0 index: 0. This value does not evaluate to type: { "label": string | number, "value": string | number | boolean }`,
        ],
      });
    });

    it("should check that each value should have label key", () => {
      expect(
        selectColumnOptionsValidation(
          [[{ value: "1" }, { value: "2" }]],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [[{ value: "1" }, { value: "2" }]],
        messages: [
          `Invalid entry at Row: 0 index: 0. Missing required key: label`,
        ],
      });

      expect(
        selectColumnOptionsValidation(
          [
            [
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ],
            [{ value: "1" }, { value: "2" }],
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
          [{ value: "1" }, { value: "2" }],
        ],
        messages: [
          `Invalid entry at Row: 1 index: 0. Missing required key: label`,
        ],
      });
    });

    it("should check that each value should have value key", () => {
      expect(
        selectColumnOptionsValidation(
          [[{ label: "1" }, { label: "2" }]],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [[{ label: "1" }, { label: "2" }]],
        messages: [
          `Invalid entry at Row: 0 index: 0. Missing required key: value`,
        ],
      });

      expect(
        selectColumnOptionsValidation(
          [
            [
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ],
            [{ label: "1" }, { label: "2" }],
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
          [{ label: "1" }, { label: "2" }],
        ],
        messages: [
          `Invalid entry at Row: 1 index: 0. Missing required key: value`,
        ],
      });
    });

    it("should check that each value should have unique value", () => {
      expect(
        selectColumnOptionsValidation(
          [
            [
              { label: "1", value: "1" },
              { label: "2", value: "1" },
            ],
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [
          [
            { label: "1", value: "1" },
            { label: "2", value: "1" },
          ],
        ],
        messages: [
          "Duplicate values found for the following properties, in the array entries, that must be unique -- value.",
        ],
      });

      expect(
        selectColumnOptionsValidation(
          [
            [
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ],
            [
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ],
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
        ],
        messages: [""],
      });
    });

    it("should check that array of arrays of label, value is valid", () => {
      expect(
        selectColumnOptionsValidation(
          [
            [
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ],
            [
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ],
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
        ],
        messages: [""],
      });
    });

    it("should check that array of JSON is valid", () => {
      expect(
        selectColumnOptionsValidation(
          [
            JSON.stringify([
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ]),
            JSON.stringify([
              { label: "1", value: "1" },
              { label: "2", value: "2" },
            ]),
          ],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
          [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
        ],
        messages: [""],
      });
    });
  });
});

describe("updateCustomColumnAliasOnLabelChange", () => {
  it("should return the propertyToUpdate array to update alias for the given custom column", () => {
    expect(
      updateCustomColumnAliasOnLabelChange(
        {} as TableWidgetProps,
        "primaryColumns.customColumn1.label",
        "customColumn12",
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.customColumn1.alias",
        propertyValue: "customColumn12",
      },
    ]);
  });

  it("should not return propertyToUpdate array to update alias for the given column", () => {
    expect(
      updateCustomColumnAliasOnLabelChange(
        {} as TableWidgetProps,
        "primaryColumns.resume_url.label",
        "customColumn12",
      ),
    ).toEqual(undefined);
  });

  it("should not return the propertyToUpdate array to update alias when any property other than label property of the custom column gets changed", () => {
    expect(
      updateCustomColumnAliasOnLabelChange(
        {} as TableWidgetProps,
        "primaryColumns.customColumn1.notlabel",
        "customColumn12",
      ),
    ).toEqual(undefined);
  });

  it("should return the propertyToUpdate array to update alias for any given custom column", () => {
    expect(
      updateCustomColumnAliasOnLabelChange(
        {} as TableWidgetProps,
        "primaryColumns.customColumn12345.label",
        "customColumn12",
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.customColumn12345.alias",
        propertyValue: "customColumn12",
      },
    ]);
  });
});
