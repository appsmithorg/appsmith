import * as generators from "../utils/generators";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
import { migrateChartDataFromArrayToObject } from "./WidgetPropsUtils";

describe("WidgetProps tests", () => {
  it("it checks if array to object migration functions for chart widget ", () => {
    const input = {
      type: WidgetTypes.CANVAS_WIDGET,
      widgetId: "0",
      widgetName: "canvas",
      parentColumnSpace: 1,
      parentRowSpace: 1,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      version: 17,
      isLoading: false,
      renderMode: RenderModes.CANVAS,
      children: [
        {
          widgetId: "some-random-id",
          widgetName: "chart1",
          parentColumnSpace: 1,
          parentRowSpace: 1,
          leftColumn: 0,
          rightColumn: 0,
          topRow: 0,
          bottomRow: 0,
          version: 17,
          isLoading: false,
          renderMode: RenderModes.CANVAS,
          type: WidgetTypes.CHART_WIDGET,
          chartData: [
            {
              seriesName: "seris1",
              data: [{ x: 1, y: 2 }],
            },
          ],
        },
      ],
    };

    // mocking implementation of our generateReactKey function
    const generatorReactKeyMock = jest.spyOn(generators, "generateReactKey");
    generatorReactKeyMock.mockImplementation(() => "some-random-key");

    const result = migrateChartDataFromArrayToObject(input);

    const output = {
      type: WidgetTypes.CANVAS_WIDGET,
      widgetId: "0",
      widgetName: "canvas",
      parentColumnSpace: 1,
      parentRowSpace: 1,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      version: 17,
      isLoading: false,
      renderMode: RenderModes.CANVAS,
      children: [
        {
          widgetId: "some-random-id",
          widgetName: "chart1",
          parentColumnSpace: 1,
          parentRowSpace: 1,
          leftColumn: 0,
          rightColumn: 0,
          topRow: 0,
          bottomRow: 0,
          version: 17,
          isLoading: false,
          renderMode: RenderModes.CANVAS,
          type: WidgetTypes.CHART_WIDGET,
          dynamicBindingPathList: [],
          chartData: {
            "some-random-key": {
              seriesName: "seris1",
              data: [{ x: 1, y: 2 }],
            },
          },
        },
      ],
    };

    expect(result).toStrictEqual(output);
  });
});
