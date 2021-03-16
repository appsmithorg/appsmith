import { VALIDATORS, validateDateString } from "workers/validations";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";

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
  version: 0,
  widgetId: "",
  widgetName: "",
};

describe("Chart data validator", () => {
  const validator = VALIDATORS.CHART_DATA;
  it("correctly validates ", () => {
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
});
