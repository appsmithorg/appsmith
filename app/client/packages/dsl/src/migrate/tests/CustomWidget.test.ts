import { migrateCustomWidgetDynamicHeight } from "../migrations/088-migrate-custom-widget-dynamic-height";
import type { DSLWidget, WidgetProps } from "../types";

const inputDSL: DSLWidget = {
  widgetId: "",
  widgetName: "canvas widget",
  type: "CANVAS_WIDGET",
  renderMode: "CANVAS",
  version: 1,
  parentColumnSpace: 1,
  parentRowSpace: 1,
  isLoading: false,
  topRow: 0,
  bottomRow: 0,
  leftColumn: 0,
  rightColumn: 0,
  children: [
    {
      widgetId: "",
      widgetName: "chart widget",
      type: "CUSTOM_WIDGET",
      renderMode: "CANVAS",
      version: 1,
      parentColumnSpace: 1,
      parentRowSpace: 1,
      isLoading: false,
      topRow: 0,
      bottomRow: 0,
      leftColumn: 0,
      rightColumn: 0,
      labelOrientation: "stagger",
      allowScroll: true,
      children: [],
    },
  ],
};

describe("Migrate Custom widget dynamic height", () => {
  it("test that dynamic height default value is set", () => {
    let outputDSL = migrateCustomWidgetDynamicHeight(inputDSL);
    let outputChartWidgetDSL = (outputDSL.children &&
      outputDSL.children[0]) as WidgetProps;

    expect(outputChartWidgetDSL.dynamicHeight).toEqual("FIXED");

    outputChartWidgetDSL.dynamicHeight = "autoheight";

    outputDSL = migrateCustomWidgetDynamicHeight(inputDSL);
    outputChartWidgetDSL = (outputDSL.children &&
      outputDSL.children[0]) as WidgetProps;

    expect(outputChartWidgetDSL.dynamicHeight).toEqual("autoheight");
  });
});
