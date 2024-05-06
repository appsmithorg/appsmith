import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  handleImageWidgetWhenPasting,
  handleJSONFormWidgetWhenPasting,
  handleTextWidgetWhenPasting,
} from ".";
import {
  widget,
  expectedImageUpdate,
  widget2,
  emptywidget,
  expectedTextUpdate,
  expectedSourceDataUpdate,
} from "./PasteWidgetUtils.fixture.test";
const widgetNameMap = {
  table1: "table1Copy",
};

function testIndividualWidgetPasting(
  widgetNameMap: Record<string, string>,
  widget: FlattenedWidgetProps,
  handler: (
    widgetNameMap: Record<string, string>,
    widget: FlattenedWidgetProps,
  ) => void,
  expectedWidget: FlattenedWidgetProps,
) {
  handler(widgetNameMap, widget);
  expect(widget).toEqual(expectedWidget);
}

describe("handleImageWidgetWhenPasting", () => {
  it("1. replaces old widget names with new widget names in the image property", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...widget } as any as FlattenedWidgetProps,
      handleImageWidgetWhenPasting,
      expectedImageUpdate as any as FlattenedWidgetProps,
    );
  });

  it("2. does not replace anything if the image property does not contain old widget names", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...widget2 } as any as FlattenedWidgetProps,
      handleImageWidgetWhenPasting,
      widget2 as any as FlattenedWidgetProps,
    );
  });

  it("3. handles empty widget name map", () => {
    testIndividualWidgetPasting(
      {},
      widget as any as FlattenedWidgetProps,
      handleImageWidgetWhenPasting,
      widget as any as FlattenedWidgetProps,
    );
  });

  it("4. handles empty image property", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...emptywidget } as any as FlattenedWidgetProps,
      handleImageWidgetWhenPasting,
      emptywidget as any as FlattenedWidgetProps,
    );
  });
});

describe("handleTextWidgetWhenPasting", () => {
  it("1. should replace old widget names with new widget names in the widget text", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...widget } as any as FlattenedWidgetProps,
      handleTextWidgetWhenPasting,
      expectedTextUpdate as any as FlattenedWidgetProps,
    );
  });

  it("2. should not modify the widget text if there are no old widget names", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...widget2 } as any as FlattenedWidgetProps,
      handleTextWidgetWhenPasting,
      widget2 as any as FlattenedWidgetProps,
    );
  });

  it("3. should not modify the widget text if the widget name map is empty", () => {
    testIndividualWidgetPasting(
      {},
      widget as any as FlattenedWidgetProps,
      handleTextWidgetWhenPasting,
      widget as any as FlattenedWidgetProps,
    );
  });

  it("4. handles empty text property", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...emptywidget } as any as FlattenedWidgetProps,
      handleImageWidgetWhenPasting,
      emptywidget as any as FlattenedWidgetProps,
    );
  });
});

describe("handleJSONFormWidgetWhenPasting", () => {
  it("should replace the old widget name with the new widget name in the source data", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...widget } as any as FlattenedWidgetProps,
      handleJSONFormWidgetWhenPasting,
      expectedSourceDataUpdate as any as FlattenedWidgetProps,
    );
  });

  it("should not replace anything if the old widget name is not present in the source data", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...widget2 } as any as FlattenedWidgetProps,
      handleJSONFormWidgetWhenPasting,
      widget2 as any as FlattenedWidgetProps,
    );
  });

  it("4. handles empty sourceData property", () => {
    testIndividualWidgetPasting(
      widgetNameMap,
      { ...emptywidget } as any as FlattenedWidgetProps,
      handleImageWidgetWhenPasting,
      emptywidget as any as FlattenedWidgetProps,
    );
  });
});
