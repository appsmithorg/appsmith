import { VALIDATORS } from "workers/validations";
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
          message:
            'Value does not match type: [{ "key1" : "val1", "key2" : "val2" }]',
          parsed: [],
          transformed: "sting text",
        },
      },
      {
        input: undefined,
        output: {
          isValid: false,
          message:
            'Value does not match type: [{ "key1" : "val1", "key2" : "val2" }]',
          parsed: [],
          transformed: undefined,
        },
      },
      {
        input: {},
        output: {
          isValid: false,
          message:
            'Value does not match type: [{ "key1" : "val1", "key2" : "val2" }]',
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
});
