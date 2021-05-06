import * as generators from "../utils/generators";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
import {
  migrateChartDataFromArrayToObject,
  migrateToNewLayout,
} from "./WidgetPropsUtils";
import {
  buildChildren,
  buildDslWithChildren,
} from "test/factories/WidgetFactoryUtils";
import { cloneDeep } from "lodash";
import { GRID_DENSITY_MIGRATION_V1 } from "mockResponses/WidgetConfigResponse";

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
  it("Grid density migration - Main container widgets", () => {
    const dsl: any = buildDslWithChildren([{ type: "TABS_WIDGET" }]);
    const newMigratedDsl: any = migrateToNewLayout(cloneDeep(dsl));
    expect(dsl.children[0].topRow * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].topRow,
    );
    expect(dsl.children[0].bottomRow * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].bottomRow,
    );
    expect(dsl.children[0].rightColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].rightColumn,
    );
    expect(dsl.children[0].leftColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].leftColumn,
    );
  });

  it("Grid density migration - widgets inside a container", () => {
    const childrenInsideContainer = buildChildren([
      { type: "SWITCH_WIDGET" },
      { type: "FORM_WIDGET" },
      { type: "CONTAINER_WIDGET" },
    ]);
    const dslWithContainer: any = buildDslWithChildren([
      { type: "CONTAINER_WIDGET", children: childrenInsideContainer },
    ]);
    const newMigratedDsl: any = migrateToNewLayout(cloneDeep(dslWithContainer));
    // Container migrated checks
    const containerWidget = dslWithContainer.children[0];
    const migratedContainer = newMigratedDsl.children[0];
    expect(containerWidget.topRow * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.topRow,
    );
    expect(containerWidget.bottomRow * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.bottomRow,
    );
    expect(containerWidget.rightColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.rightColumn,
    );
    expect(containerWidget.leftColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.leftColumn,
    );
    // Children inside container miragted

    containerWidget.children.forEach((eachChild: any, index: any) => {
      const migratedChild = migratedContainer.children[index];
      expect(eachChild.topRow * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.topRow,
      );
      expect(eachChild.bottomRow * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.bottomRow,
      );
      expect(eachChild.rightColumn * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.rightColumn,
      );
      expect(eachChild.leftColumn * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.leftColumn,
      );
    });
  });
});
