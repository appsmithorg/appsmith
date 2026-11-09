import { migrateTableWidgetV2DynamicHeight } from "../../migrations/094-migrate-table-widget-v2-dynamic-height";
import type { DSLWidget, WidgetProps } from "../../types";

const baseWidget = {
  renderMode: "CANVAS",
  version: 1,
  parentColumnSpace: 1,
  parentRowSpace: 1,
  isLoading: false,
  topRow: 0,
  bottomRow: 0,
  leftColumn: 0,
  rightColumn: 0,
};

const getInputDSL = (): DSLWidget => ({
  ...baseWidget,
  widgetId: "0",
  widgetName: "MainContainer",
  type: "CANVAS_WIDGET",
  children: [
    {
      ...baseWidget,
      widgetId: "1",
      widgetName: "Table1",
      type: "TABLE_WIDGET_V2",
      children: [],
    },
    {
      ...baseWidget,
      widgetId: "2",
      widgetName: "Container1",
      type: "CONTAINER_WIDGET",
      children: [
        {
          ...baseWidget,
          widgetId: "3",
          widgetName: "Canvas1",
          type: "CANVAS_WIDGET",
          children: [
            {
              ...baseWidget,
              widgetId: "4",
              widgetName: "Table2",
              type: "TABLE_WIDGET_V2",
              children: [],
            },
          ],
        },
      ],
    },
    {
      ...baseWidget,
      widgetId: "5",
      widgetName: "Table3",
      type: "TABLE_WIDGET_V2",
      dynamicHeight: "AUTO_HEIGHT",
      children: [],
    },
    {
      ...baseWidget,
      widgetId: "8",
      widgetName: "Table4",
      type: "TABLE_WIDGET_V2",
      dynamicHeight: "FIXED",
      children: [],
    },
    {
      ...baseWidget,
      widgetId: "9",
      widgetName: "Table5",
      type: "TABLE_WIDGET_V2",
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      children: [],
    },
    {
      ...baseWidget,
      widgetId: "6",
      widgetName: "TableV1",
      type: "TABLE_WIDGET",
      children: [],
    },
    {
      ...baseWidget,
      widgetId: "7",
      widgetName: "Text1",
      type: "TEXT_WIDGET",
      children: [],
    },
  ],
});

const findWidget = (
  widget: WidgetProps,
  widgetId: string,
): WidgetProps | undefined => {
  if (widget.widgetId === widgetId) return widget;

  for (const child of widget.children ?? []) {
    const found = findWidget(child, widgetId);

    if (found) return found;
  }

  return undefined;
};

describe("Migrate TABLE_WIDGET_V2 dynamic height", () => {
  it("sets FIXED on tables without dynamicHeight, at any depth", () => {
    const outputDSL = migrateTableWidgetV2DynamicHeight(getInputDSL());

    expect(findWidget(outputDSL, "1")?.dynamicHeight).toEqual("FIXED");
    expect(findWidget(outputDSL, "4")?.dynamicHeight).toEqual("FIXED");
  });

  it("keeps an existing dynamicHeight value", () => {
    const outputDSL = migrateTableWidgetV2DynamicHeight(getInputDSL());

    expect(findWidget(outputDSL, "5")?.dynamicHeight).toEqual("AUTO_HEIGHT");
    expect(findWidget(outputDSL, "8")?.dynamicHeight).toEqual("FIXED");
    expect(findWidget(outputDSL, "9")?.dynamicHeight).toEqual(
      "AUTO_HEIGHT_WITH_LIMITS",
    );
  });

  it("does not touch other widget types", () => {
    const outputDSL = migrateTableWidgetV2DynamicHeight(getInputDSL());

    expect(findWidget(outputDSL, "6")).not.toHaveProperty("dynamicHeight");
    expect(findWidget(outputDSL, "7")).not.toHaveProperty("dynamicHeight");
    expect(findWidget(outputDSL, "2")).not.toHaveProperty("dynamicHeight");
  });

  it("is idempotent", () => {
    const firstRun = migrateTableWidgetV2DynamicHeight(getInputDSL());
    const snapshot = JSON.parse(JSON.stringify(firstRun));
    const secondRun = migrateTableWidgetV2DynamicHeight(firstRun);

    expect(secondRun).toEqual(snapshot);
  });
});
