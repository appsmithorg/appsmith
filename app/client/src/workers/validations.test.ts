import { VALIDATORS, validateDateString } from "workers/validations";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
import moment from "moment";

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: WidgetTypes.SKELETON_WIDGET,
  version: 2,
  widgetId: "",
  widgetName: "",
};

describe("Validate Validators", () => {
  const validator = VALIDATORS.CHART_DATA;
  it("correctly validates chart data ", () => {
    const cases = [
      {
        input: [
          {
            seriesName: "Sales",
            data: [{ x: "Jan", y: 1000 }],
          },
        ],
        output: {
          isValid: true,
          parsed: [
            {
              seriesName: "Sales",
              data: [{ x: "Jan", y: 1000 }],
            },
          ],
          transformed: [
            {
              seriesName: "Sales",
              data: [{ x: "Jan", y: 1000 }],
            },
          ],
        },
      },
      {
        input: [
          {
            seriesName: "Sales",
            data: [{ x: "Jan", y: 1000 }, { x: "Feb" }],
          },
        ],
        output: {
          isValid: false,
          message: '0##Value does not match type: [{ "x": "val", "y": "val" }]',
          parsed: [
            {
              seriesName: "Sales",
              data: [],
            },
          ],
          transformed: [
            {
              seriesName: "Sales",
              data: [{ x: "Jan", y: 1000 }, { x: "Feb" }],
            },
          ],
        },
      },
      {
        input: [
          {
            seriesName: "Sales",
            data: undefined,
          },
          {
            seriesName: "Expenses",
            data: [
              { x: "Jan", y: 1000 },
              { x: "Feb", y: 2000 },
            ],
          },
        ],
        output: {
          isValid: false,
          message: '0##Value does not match type: [{ "x": "val", "y": "val" }]',
          parsed: [
            {
              seriesName: "Sales",
              data: [],
            },
            {
              seriesName: "Expenses",
              data: [
                { x: "Jan", y: 1000 },
                { x: "Feb", y: 2000 },
              ],
            },
          ],
          transformed: [
            {
              seriesName: "Sales",
              data: undefined,
            },
            {
              seriesName: "Expenses",
              data: [
                { x: "Jan", y: 1000 },
                { x: "Feb", y: 2000 },
              ],
            },
          ],
        },
      },
    ];
    for (const testCase of cases) {
      const response = validator(testCase.input, DUMMY_WIDGET, {});
      expect(response).toStrictEqual(testCase.output);
    }
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
        expectedResult.message = `Value does not match type: number[]`;
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
          type: "area2d",
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
            type: "area2d",
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
            type: "area2d",
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
            "Value does not match type: {type: string, dataSource: { chart: object, data: Array<{label: string, value: number}>}}",
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
