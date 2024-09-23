import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { klona } from "klona";
import {
  accessNestedObjectValue,
  handleJSONFormPropertiesListedInDynamicBindingPath,
  handleWidgetDynamicBindingPathList,
  handleWidgetDynamicPropertyPathList,
  handleWidgetDynamicTriggerPathList,
} from ".";

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

  it("4. should work for null/undefined object", () => {
    const obj = null;

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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe("handleWidgetDynamicTriggerPathList", () => {
  const widget = {
    dynamicTriggerPathList: [{ key: "onClick" }],
    onClick: "{{oldName.val}}",
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as FlattenedWidgetProps;

  it("1. should replace old widget names with new widget names in dynamic trigger paths", () => {
    const widgetNameMap = {
      oldName: "newName",
    };
    const button = klona(widget);

    handleWidgetDynamicTriggerPathList(widgetNameMap, button);
    expect(button.onClick).toEqual("{{newName.val}}");
  });

  it("2. should do nothing if the widgetNameMap does not contain names in dynamic trigger paths", () => {
    const widgetNameMap = {
      oldWidget1: "newWidget1",
    };
    const button = klona(widget);

    handleWidgetDynamicTriggerPathList(widgetNameMap, button);
    expect(button.onClick).toEqual("{{oldName.val}}");
  });
});

describe("handleWidgetDynamicBindingPathList", () => {
  const widget = {
    dynamicBindingPathList: [{ key: "onClick" }],
    onClick: "{{oldName.val}}",
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as FlattenedWidgetProps;

  it("1. should replace old widget names with new widget names in dynamic trigger paths", () => {
    const widgetNameMap = {
      oldName: "newName",
    };
    const button = klona(widget);

    handleWidgetDynamicBindingPathList(widgetNameMap, button);
    expect(button.onClick).toEqual("{{newName.val}}");
  });

  it("2. should do nothing if the widgetNameMap does not contain names in dynamic trigger paths", () => {
    const widgetNameMap = {
      oldWidget1: "newWidget1",
    };
    const button = klona(widget);

    handleWidgetDynamicBindingPathList(widgetNameMap, button);
    expect(button.onClick).toEqual("{{oldName.val}}");
  });
});

describe("handleWidgetDynamicPropertyPathList", () => {
  const widget = {
    dynamicPropertyPathList: [{ key: "onClick" }],
    onClick: "{{oldName.val}}",
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as FlattenedWidgetProps;

  it("1. should replace old widget names with new widget names in dynamic trigger paths", () => {
    const widgetNameMap = {
      oldName: "newName",
    };
    const button = klona(widget);

    handleWidgetDynamicPropertyPathList(widgetNameMap, button);
    expect(button.onClick).toEqual("{{newName.val}}");
  });

  it("2. should do nothing if the widgetNameMap does not contain names in dynamic trigger paths", () => {
    const widgetNameMap = {
      oldWidget1: "newWidget1",
    };
    const button = klona(widget);

    handleWidgetDynamicPropertyPathList(widgetNameMap, button);
    expect(button.onClick).toEqual("{{oldName.val}}");
  });
});
