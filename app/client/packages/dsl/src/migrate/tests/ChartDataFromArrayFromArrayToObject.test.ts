import { migrateChartDataFromArrayToObject } from "../migrations/016-migrate-chart-data-from-array-to-object";
import * as utils from "../utils";

it("it checks if array to object migration functions for chart widget ", () => {
  const input = {
    type: "CANVAS_WIDGET",
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
    renderMode: "CANVAS",
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
        renderMode: "CANVAS",
        type: "CHART_WIDGET",
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
  const generatorReactKeyMock = jest.spyOn(utils, "generateReactKey");

  generatorReactKeyMock.mockImplementation(() => "some-random-key");

  const result = migrateChartDataFromArrayToObject(input);

  const output = {
    type: "CANVAS_WIDGET",
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
    renderMode: "CANVAS",
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
        renderMode: "CANVAS",
        type: "CHART_WIDGET",
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
