import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  accessNestedObjectValue,
  handleImageWidgetWhenPasting,
  handleJSONFormWidgetWhenPasting,
  handleTextWidgetWhenPasting,
  handleJSONFormPropertiesListedInDynamicBindingPath,
} from ".";
import {
  widget,
  expectedImageUpdate,
  widget2,
  emptywidget,
  expectedTextUpdate,
  expectedSourceDataUpdate,
} from "./PasteWidgetUtils.fixture";
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

describe("accessNestedObjectValue", () => {
  it("1. should replace the old value with the new value in a nested object", () => {
    const obj = {
      foo: {
        bar: {
          baz: "oldValue",
        },
      },
    };

    const oldValue = "oldValue";
    const newValue = "newValue";

    accessNestedObjectValue(obj, "foo.bar.baz", oldValue, newValue);

    expect(obj.foo.bar.baz).toEqual(newValue);
  });

  it("2. should not replace the value if it does not match the old value", () => {
    const obj = {
      foo: {
        bar: {
          baz: "value",
        },
      },
    };

    const oldValue = "oldValue";
    const newValue = "newValue";

    accessNestedObjectValue(obj, "foo.bar.baz", oldValue, newValue);

    expect(obj.foo.bar.baz).toEqual("value");
  });

  it("3. should return undefined if the path does not exist in the object", () => {
    const obj = {
      foo: {
        bar: {
          baz: "value",
        },
      },
    };

    const oldValue = "oldValue";
    const newValue = "newValue";

    const result = accessNestedObjectValue(
      obj,
      "foo.bar.qux",
      oldValue,
      newValue,
    );

    expect(result).toBeUndefined();
  });
});

describe("handleJSONFormPropertiesListedInDynamicBindingPath", () => {
  it("1. should replace the oldName with the newName in the dynamicBindingPathList of the widget", () => {
    const widget = {
      dynamicBindingPathList: [
        { key: "schema.__rootSchema__.property1" },
        { key: "defaultValue" },
        { key: "property3" },
      ],
      defaultValue: "{{oldName.val}}",
      schema: {
        __rootSchema__: {
          property1: "{{oldName.test}}",
        },
      },
    };
    const oldName = "oldName";
    const newName = "newName";

    handleJSONFormPropertiesListedInDynamicBindingPath(
      widget as any as FlattenedWidgetProps,
      oldName,
      newName,
    );

    expect(widget.schema.__rootSchema__.property1).toEqual("{{newName.test}}");

    expect(widget.defaultValue).toEqual("{{newName.val}}");

    expect(widget.dynamicBindingPathList).toEqual([
      { key: "schema.__rootSchema__.property1" },
      { key: "defaultValue" },
      { key: "property3" },
    ]);
  });
});
