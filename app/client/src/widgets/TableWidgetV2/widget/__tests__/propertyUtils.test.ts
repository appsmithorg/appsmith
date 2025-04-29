import {
  updateAllowAddNewRowOnInfiniteScrollChange,
  updateServerSidePaginationOnInfiniteScrollChange,
} from "../propertyUtils";
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
  allowedFirstDayOfWeekRange,
  updateCellEditabilityOnInfiniteScrollChange,
  updateSearchSortFilterOnInfiniteScrollChange,
} from "../propertyUtils";
import _ from "lodash";
import type { ColumnTypes, TableWidgetProps } from "../../constants";
import { StickyType } from "../../component/Constants";

describe("PropertyUtils - ", () => {
  it("totalRecordsCountValidation - should test with all possible values", () => {
    const ERROR_MESSAGE = [
      { name: "ValidationError", message: "This value must be a number" },
    ];

    const values = [
      [
        undefined,
        {
          isValid: true,
          parsed: 0,
          messages: [],
        },
      ],
      [
        null,
        {
          isValid: true,
          parsed: 0,
          messages: [],
        },
      ],
      [
        "",
        {
          isValid: true,
          parsed: 0,
          messages: [],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: 0,
          messages: ERROR_MESSAGE,
        },
      ],
      [
        [],
        {
          isValid: false,
          parsed: 0,
          messages: ERROR_MESSAGE,
        },
      ],
      [
        "test",
        {
          isValid: false,
          parsed: 0,
          messages: ERROR_MESSAGE,
        },
      ],
      [
        "1",
        {
          isValid: true,
          parsed: 1,
          messages: [],
        },
      ],
      [
        1,
        {
          isValid: true,
          parsed: 1,
          messages: [],
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props as any as TableWidgetProps,
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props as any as TableWidgetProps,
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props as any as TableWidgetProps,
        "",
        "someOtherRandomStyleValue",
      ),
    ).toEqual(undefined);

    expect(
      updateColumnStyles(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any as TableWidgetProps,
        "style",
        "someOtherRandomStyleValue",
      ),
    ).toEqual(undefined);

    expect(
      updateColumnStyles(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any as TableWidgetProps,
        "",
        "someOtherRandomStyleValue",
      ),
    ).toEqual(undefined);
  });

  it("updateColumnOrderHook - should test with all possible values", () => {
    const defaultStickyValuesForPrimaryCols = {
      column1: {
        sticky: StickyType.NONE,
      },
      column2: {
        sticky: StickyType.NONE,
      },
      column3: {
        sticky: StickyType.NONE,
      },
    };

    expect(
      updateColumnOrderHook(
        {
          columnOrder: ["column1", "column2"],
          primaryColumns: defaultStickyValuesForPrimaryCols,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as TableWidgetProps,
        "primaryColumns.column3",
        {
          id: "column3",
        },
      ),
    ).toEqual([
      {
        propertyPath: "columnOrder",
        propertyValue: ["column1", "column2", "column3"],
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
        {
          columnOrder: ["column1", "column2"],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as TableWidgetProps,
        "",
        {
          id: "column3",
        },
      ),
    ).toEqual(undefined);

    expect(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateColumnOrderHook({} as any as TableWidgetProps, "", {
        id: "column3",
      }),
    ).toEqual(undefined);

    expect(
      updateColumnOrderHook(
        {
          columnOrder: ["column1", "column2"],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as TableWidgetProps,
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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prop as any as TableWidgetProps,
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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prop as any as TableWidgetProps,
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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prop as any as TableWidgetProps,
          "primaryColumns.column.buttonColor",
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ["Button"] as any as ColumnTypes[],
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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prop as any as TableWidgetProps,
          "primaryColumns.column.buttonColor",
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ["Button"] as any as ColumnTypes[],
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
        {
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
        } as unknown as TableWidgetProps,
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
        {
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
        } as unknown as TableWidgetProps,
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
        {
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
        } as unknown as TableWidgetProps,
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

    it("should check that there are no null or undefined values", () => {
      expect(
        selectColumnOptionsValidation(
          [null, { label: "2", value: "1" }],
          {} as TableWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: false,
        parsed: [],
        messages: [
          `Invalid entry at index: 0. This value does not evaluate to type: { "label": string | number, "value": string | number | boolean }`,
        ],
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

describe("allowedFirstDayOfWeekRange", () => {
  it("should return valid object value is within 0 to 6", () => {
    expect(allowedFirstDayOfWeekRange(4)).toEqual({
      isValid: true,
      parsed: 4,
      messages: [],
    });
  });

  it("should return valid object value is within 0 to 6", () => {
    expect(allowedFirstDayOfWeekRange(0)).toEqual({
      isValid: true,
      parsed: 0,
      messages: [],
    });
  });

  it("should return invalid object when value is not within 0 to 6", () => {
    expect(allowedFirstDayOfWeekRange(8)).toEqual({
      isValid: false,
      parsed: 0,
      messages: ["Number should be between 0-6."],
    });
  });

  it("should return invalid object when value is not within 0 to 6", () => {
    expect(allowedFirstDayOfWeekRange(-2)).toEqual({
      isValid: false,
      parsed: 0,
      messages: ["Number should be between 0-6."],
    });
  });
});

describe("Infinite Scroll Update Hooks - ", () => {
  it("updateAllowAddNewRowOnInfiniteScrollChange - should disable/enable add new row when infinite scroll is toggled", () => {
    const props = {} as TableWidgetProps;

    // When infinite scroll is enabled
    expect(
      updateAllowAddNewRowOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        true,
      ),
    ).toEqual([
      {
        propertyPath: "allowAddNewRow",
        propertyValue: false,
      },
    ]);

    // When infinite scroll is disabled
    expect(
      updateAllowAddNewRowOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        false,
      ),
    ).toEqual([
      {
        propertyPath: "allowAddNewRow",
        propertyValue: true,
      },
    ]);

    // When some other value is passed
    expect(
      updateAllowAddNewRowOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        "some-other-value",
      ),
    ).toBeUndefined();
  });

  it("updateSearchSortFilterOnInfiniteScrollChange - should disable/enable search, filter, sort when infinite scroll is toggled", () => {
    const props = {} as TableWidgetProps;

    // When infinite scroll is enabled
    expect(
      updateSearchSortFilterOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        true,
      ),
    ).toEqual([
      {
        propertyPath: "isVisibleSearch",
        propertyValue: false,
      },
      {
        propertyPath: "isVisibleFilters",
        propertyValue: false,
      },
      {
        propertyPath: "isSortable",
        propertyValue: false,
      },
    ]);

    // When infinite scroll is disabled
    expect(
      updateSearchSortFilterOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        false,
      ),
    ).toEqual([
      {
        propertyPath: "isVisibleFilters",
        propertyValue: true,
      },
      {
        propertyPath: "isVisibleSearch",
        propertyValue: true,
      },
      {
        propertyPath: "isSortable",
        propertyValue: true,
      },
    ]);

    // When some other value is passed
    expect(
      updateSearchSortFilterOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        "some-other-value",
      ),
    ).toBeUndefined();
  });

  it("updateCellEditabilityOnInfiniteScrollChange - should disable cell editability when infinite scroll is enabled", () => {
    // Setup mock primary columns
    const props = {
      primaryColumns: {
        column1: {
          id: "column1",
          alias: "column1",
          isEditable: true,
          isCellEditable: true,
        },
        column2: {
          id: "column2",
          alias: "column2",
          isEditable: true,
          isCellEditable: true,
        },
      },
    } as unknown as TableWidgetProps;

    // When infinite scroll is enabled
    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        true,
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.column1.isCellEditable",
        propertyValue: false,
      },
      {
        propertyPath: "primaryColumns.column1.isEditable",
        propertyValue: false,
      },
      {
        propertyPath: "primaryColumns.column2.isCellEditable",
        propertyValue: false,
      },
      {
        propertyPath: "primaryColumns.column2.isEditable",
        propertyValue: false,
      },
    ]);

    // When infinite scroll is disabled
    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        false,
      ),
    ).toEqual([
      {
        propertyPath: "primaryColumns.column1.isCellEditable",
        propertyValue: true,
      },
      {
        propertyPath: "primaryColumns.column1.isEditable",
        propertyValue: true,
      },
      {
        propertyPath: "primaryColumns.column2.isCellEditable",
        propertyValue: true,
      },
      {
        propertyPath: "primaryColumns.column2.isEditable",
        propertyValue: true,
      },
    ]);

    // Test with no primary columns
    const propsWithoutColumns = {} as TableWidgetProps;

    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        propsWithoutColumns,
        "infiniteScrollEnabled",
        true,
      ),
    ).toBeUndefined();

    // When some other value is passed
    expect(
      updateCellEditabilityOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        "some-other-value",
      ),
    ).toBeUndefined();
  });

  it("updateServerSidePaginationOnInfiniteScrollChange - should enable server side pagination when infinite scroll is enabled", () => {
    const props = {} as TableWidgetProps;

    expect(
      updateServerSidePaginationOnInfiniteScrollChange(
        props,
        "infiniteScrollEnabled",
        true,
      ),
    ).toEqual([
      {
        propertyPath: "serverSidePaginationEnabled",
        propertyValue: true,
      },
    ]);
  });
});
