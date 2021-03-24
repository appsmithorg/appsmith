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
