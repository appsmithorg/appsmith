import { VALIDATORS, validateDateString } from "workers/validations";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import moment from "moment";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  version: 2,
  widgetId: "",
  widgetName: "",
};

describe("Validate Validators", () => {
  it("correctly validates chart series data ", () => {
    const cases = [
      {
        input: [{ x: "Jan", y: 1000 }],
        output: {
          isValid: true,
          parsed: [{ x: "Jan", y: 1000 }],
          transformed: [{ x: "Jan", y: 1000 }],
        },
      },
      {
        input: [{ x: "Jan", y: 1000 }, { x: "Feb" }],
        output: {
          isValid: false,
          message:
            'This value does not evaluate to type: "Array<x:string, y:number>"',
          parsed: [],
          transformed: [{ x: "Jan", y: 1000 }, { x: "Feb" }],
        },
      },
      {
        input: undefined,
        output: {
          isValid: false,
          message:
            'This value does not evaluate to type: "Array<x:string, y:number>"',
          parsed: [],
          transformed: undefined,
        },
      },
    ];
    for (const testCase of cases) {
      const response = VALIDATORS.CHART_SERIES_DATA(
        testCase.input,
        DUMMY_WIDGET,
        {},
      );
      expect(response).toStrictEqual(testCase.output);
    }
  });
  it("Correctly validates image string", () => {
    const input =
      "https://cdn.dribbble.com/users/1787323/screenshots/4563995/dribbbe_hammer-01.png";
    const result = VALIDATORS.IMAGE(input, DUMMY_WIDGET, undefined);
    const expectedResult: {
      isValid: boolean;
      parsed: string;
      message?: string;
    } = {
      isValid: true,
      parsed: input,
      message: "",
    };
    expect(result).toStrictEqual(expectedResult);
  });
  it("Correctly validates page number", () => {
    const input = [0, -1, undefined, null, 2, "abcd", [], ""];
    const expected = [1, 1, 1, 1, 2, 1, 1, 1];
    input.forEach((val, index) => {
      const result = VALIDATORS.TABLE_PAGE_NO(val, DUMMY_WIDGET, undefined);
      const expectedResult: {
        isValid: boolean;
        parsed: number;
        message?: string;
      } = {
        isValid: expected[index] !== 1,
        parsed: expected[index],
      };
      if (expected[index] === 1) {
        expectedResult.message = "";
      }
      expect(result).toStrictEqual(expectedResult);
    });
  });
  it("Correctly validates row indices", () => {
    const input = [0, "-1", undefined, null, "abcd", [], "", "2, 3", "-1, 2"];
    const expected = [[0], [], [], [], [], [], [], [2, 3], [2]];
    const invalidIndices = [2, 3];
    input.forEach((val, index) => {
      const result = VALIDATORS.ROW_INDICES(
        val,
        { ...DUMMY_WIDGET, multiRowSelection: true },
        undefined,
      );
      const expectedResult: {
        isValid: boolean;
        parsed: number[];
        message?: string;
      } = {
        isValid: !invalidIndices.includes(index),
        parsed: expected[index],
      };
      if (invalidIndices.includes(index)) {
        expectedResult.message = `This value does not evaluate to type: number[]`;
      }
      expect(result).toStrictEqual(expectedResult);
    });
  });
});

describe("Chart Custom Config validator", () => {
  const validator = VALIDATORS.CUSTOM_FUSION_CHARTS_DATA;
  it("correctly validates ", () => {
    const cases = [
      {
        input: {
          type: "area",
          dataSource: {
            chart: {
              caption: "Countries With Most Oil Reserves [2017-18]",
              subCaption: "In MMbbl = One Million barrels",
              xAxisName: "Country",
              yAxisName: "Reserves (MMbbl)",
              numberSuffix: "K",
            },
            data: [
              {
                label: "Venezuela",
                value: "290",
              },
              {
                label: "Saudi",
                value: "260",
              },
              {
                label: "Canada",
                value: "180",
              },
              {
                label: "Iran",
                value: "140",
              },
              {
                label: "Russia",
                value: "115",
              },
              {
                label: "UAE",
                value: "100",
              },
              {
                label: "US",
                value: "30",
              },
              {
                label: "China",
                value: "30",
              },
            ],
          },
        },

        output: {
          isValid: true,
          parsed: {
            type: "area",
            dataSource: {
              chart: {
                caption: "Countries With Most Oil Reserves [2017-18]",
                subCaption: "In MMbbl = One Million barrels",
                xAxisName: "Country",
                yAxisName: "Reserves (MMbbl)",
                numberSuffix: "K",
              },
              data: [
                {
                  label: "Venezuela",
                  value: "290",
                },
                {
                  label: "Saudi",
                  value: "260",
                },
                {
                  label: "Canada",
                  value: "180",
                },
                {
                  label: "Iran",
                  value: "140",
                },
                {
                  label: "Russia",
                  value: "115",
                },
                {
                  label: "UAE",
                  value: "100",
                },
                {
                  label: "US",
                  value: "30",
                },
                {
                  label: "China",
                  value: "30",
                },
              ],
            },
          },

          transformed: {
            type: "area",
            dataSource: {
              chart: {
                caption: "Countries With Most Oil Reserves [2017-18]",
                subCaption: "In MMbbl = One Million barrels",
                xAxisName: "Country",
                yAxisName: "Reserves (MMbbl)",
                numberSuffix: "K",
              },
              data: [
                {
                  label: "Venezuela",
                  value: "290",
                },
                {
                  label: "Saudi",
                  value: "260",
                },
                {
                  label: "Canada",
                  value: "180",
                },
                {
                  label: "Iran",
                  value: "140",
                },
                {
                  label: "Russia",
                  value: "115",
                },
                {
                  label: "UAE",
                  value: "100",
                },
                {
                  label: "US",
                  value: "30",
                },
                {
                  label: "China",
                  value: "30",
                },
              ],
            },
          },
        },
      },
      {
        input: {
          type: "area2d",
          dataSource: {
            data: [
              {
                label: "Venezuela",
                value: "290",
              },
              {
                label: "Saudi",
                value: "260",
              },
              {
                label: "Canada",
                value: "180",
              },
              {
                label: "Iran",
                value: "140",
              },
              {
                label: "Russia",
                value: "115",
              },
              {
                label: "UAE",
                value: "100",
              },
              {
                label: "US",
                value: "30",
              },
              {
                label: "China",
                value: "30",
              },
            ],
          },
        },
        output: {
          isValid: true,
          parsed: {
            type: "area2d",
            dataSource: {
              data: [
                {
                  label: "Venezuela",
                  value: "290",
                },
                {
                  label: "Saudi",
                  value: "260",
                },
                {
                  label: "Canada",
                  value: "180",
                },
                {
                  label: "Iran",
                  value: "140",
                },
                {
                  label: "Russia",
                  value: "115",
                },
                {
                  label: "UAE",
                  value: "100",
                },
                {
                  label: "US",
                  value: "30",
                },
                {
                  label: "China",
                  value: "30",
                },
              ],
            },
          },

          transformed: {
            type: "area2d",
            dataSource: {
              data: [
                {
                  label: "Venezuela",
                  value: "290",
                },
                {
                  label: "Saudi",
                  value: "260",
                },
                {
                  label: "Canada",
                  value: "180",
                },
                {
                  label: "Iran",
                  value: "140",
                },
                {
                  label: "Russia",
                  value: "115",
                },
                {
                  label: "UAE",
                  value: "100",
                },
                {
                  label: "US",
                  value: "30",
                },
                {
                  label: "China",
                  value: "30",
                },
              ],
            },
          },
        },
      },
      {
        input: {
          type: undefined,
          dataSource: undefined,
        },
        output: {
          isValid: false,
          message:
            'This value does not evaluate to type "{type: string, dataSource: { chart: object, data: Array<{label: string, value: number}>}}"',
          parsed: {
            type: undefined,
            dataSource: undefined,
          },
          transformed: {
            type: undefined,
            dataSource: undefined,
          },
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(testCase.input, DUMMY_WIDGET, {});
      expect(response).toStrictEqual(testCase.output);
    }
  });
});
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
      {
        date: "2021-03-12",
        format: "YYYY-MM-DD",
        version: 2,
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
        date: "abcd",
        format: "abcd",
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

  it("Checks whether a valid value is returned even if a valid date is not an ISO string", () => {
    const validator = VALIDATORS.DEFAULT_DATE;
    const inputs = [
      "2014/12/01",
      "2014-12-01",
      "01/13/2014",
      "01-13-2014",
      moment().toISOString(),
      moment().toISOString(true),
    ];
    inputs.forEach((item) => {
      const dateString = moment(item).toISOString(true);
      const result = validator(item, DUMMY_WIDGET);

      const expected = {
        parsed: dateString,
        isValid: true,
        message: "",
      };
      expect(result).toStrictEqual(expected);
    });
  });
});

describe("List data validator", () => {
  const validator = VALIDATORS.LIST_DATA;
  it("correctly validates ", () => {
    const cases = [
      {
        input: [],
        output: {
          isValid: true,
          parsed: [],
        },
      },
      {
        input: [{ a: 1 }],
        output: {
          isValid: true,
          parsed: [{ a: 1 }],
        },
      },
      {
        input: "sting text",
        output: {
          isValid: false,
          message: 'This value does not evaluate to type: "Array<Object>"',
          parsed: [],
          transformed: "sting text",
        },
      },
      {
        input: undefined,
        output: {
          isValid: false,
          message: 'This value does not evaluate to type: "Array<Object>"',
          parsed: [],
          transformed: undefined,
        },
      },
      {
        input: {},
        output: {
          isValid: false,
          message: 'This value does not evaluate to type: "Array<Object>"',
          parsed: [],
          transformed: {},
        },
      },
      {
        input: `[{ "b": 1 }]`,
        output: {
          isValid: true,
          parsed: JSON.parse(`[{ "b": 1 }]`),
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(testCase.input, DUMMY_WIDGET, {});
      expect(response).toStrictEqual(testCase.output);
    }
  });

  it("Validates DEFAULT_OPTION_VALUE correctly (string trim and integers)", () => {
    const validator = VALIDATORS[VALIDATION_TYPES.DEFAULT_OPTION_VALUE];
    const widgetProps = { ...DUMMY_WIDGET, selectionType: "SINGLE_SELECT" };
    const inputs = [100, "something ", "something\n"];
    const expected = [
      {
        isValid: true,
        parsed: "100",
      },
      {
        isValid: true,
        parsed: "something",
      },
      {
        isValid: true,
        parsed: "something",
      },
    ];
    inputs.forEach((input, index) => {
      const response = validator(input, widgetProps);
      expect(response).toStrictEqual(expected[index]);
    });
  });
});

describe("Rating widget : defaultRate", () => {
  const validator = VALIDATORS.RATE_DEFAULT_RATE;
  it("An input is not a number", () => {
    const cases = [
      {
        input: undefined,
        output: {
          isValid: false,
          parsed: 0,
          message: 'This value does not evaluate to type "number"',
        },
      },
      {
        input: "",
        output: {
          isValid: true,
          parsed: 0,
        },
      },
      {
        input: "string",
        output: {
          isValid: false,
          parsed: 0,
          message: 'This value does not evaluate to type "number"',
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(testCase.input, DUMMY_WIDGET, {});
      expect(response).toStrictEqual(testCase.output);
    }
  });

  it("An input is a number & maxCount", () => {
    const cases = [
      {
        input: 3,
        output: {
          isValid: true,
          parsed: 3,
        },
      },
      {
        input: 5,
        output: {
          isValid: true,
          parsed: 5,
        },
      },
      {
        input: 6,
        output: {
          isValid: false,
          parsed: 6,
          message: "This value must be less than or equal to max count",
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(
        testCase.input,
        { ...DUMMY_WIDGET, maxCount: 5 },
        {},
      );
      expect(response).toStrictEqual(testCase.output);
    }
  });

  it("An input is a number & isAllowedHalf=true", () => {
    const cases = [
      {
        input: 3,
        output: {
          isValid: true,
          parsed: 3,
        },
      },
      {
        input: 3.5,
        output: {
          isValid: true,
          parsed: 3.5,
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(
        testCase.input,
        { ...DUMMY_WIDGET, isAllowHalf: true },
        {},
      );
      expect(response).toStrictEqual(testCase.output);
    }
  });

  it("An input is a number & isAllowedHalf=false", () => {
    const cases = [
      {
        input: 3,
        output: {
          isValid: true,
          parsed: 3,
        },
      },
      {
        input: 3.5,
        output: {
          isValid: false,
          parsed: 3.5,
          message: `This value can be a decimal onlf if 'Allow half' is true`,
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(
        testCase.input,
        { ...DUMMY_WIDGET, isAllowHalf: false },
        {},
      );
      expect(response).toStrictEqual(testCase.output);
    }
  });
});

describe("Rating widget : maxCount", () => {
  const validator = VALIDATORS.RATE_MAX_COUNT;
  it("An input is not a number", () => {
    const cases = [
      {
        input: undefined,
        output: {
          isValid: false,
          parsed: 0,
          message: 'This value does not evaluate to type "number"',
        },
      },
      {
        input: "",
        output: {
          isValid: true,
          parsed: 0,
        },
      },
      {
        input: "string",
        output: {
          isValid: false,
          parsed: 0,
          message: 'This value does not evaluate to type "number"',
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(testCase.input, DUMMY_WIDGET, {});
      expect(response).toStrictEqual(testCase.output);
    }
  });

  it("An input is a number, should be an integer", () => {
    const cases = [
      {
        input: 3,
        output: {
          isValid: true,
          parsed: 3,
        },
      },
      {
        input: 3.5,
        output: {
          isValid: false,
          parsed: 3.5,
          message: "This value must be integer",
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(testCase.input, DUMMY_WIDGET, {});
      expect(response).toStrictEqual(testCase.output);
    }
  });
});

describe("Color Picker Text validator", () => {
  const validator = VALIDATORS.COLOR_PICKER_TEXT;
  const inputs = [
    "#e0e0e0",
    "rgb(200,200,200)",
    "{{Text2.text}}",
    "<p>red</p>",
  ];
  const expected = [
    {
      isValid: true,
      parsed: "#e0e0e0",
    },
    {
      isValid: true,
      parsed: "rgb(200,200,200)",
    },
    {
      isValid: false,
      parsed: "",
      message: "This value does not evaluate to type: text",
    },
    {
      isValid: false,
      parsed: "",
      message: "This value does not evaluate to type: text",
    },
  ];
  inputs.forEach((input, index) => {
    const response = validator(input, DUMMY_WIDGET);
    expect(response).toStrictEqual(expected[index]);
  });
});
