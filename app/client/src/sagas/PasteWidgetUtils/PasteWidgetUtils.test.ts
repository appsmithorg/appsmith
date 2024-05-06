import { handleImageWidgetWhenPasting, handleTextWidgetWhenPasting } from ".";

describe("handleImageWidgetWhenPasting", () => {
  it("1. replaces old widget names with new widget names in the image property", () => {
    const widgetNameMap = {
      table1: "table1Copy",
    };

    const widget = {
      image: "{{table1.selectedRowData.image}}",
    };

    handleImageWidgetWhenPasting(widgetNameMap, widget as any);

    expect(widget.image).toBe("{{table1Copy.selectedRowData.image}}");
  });

  it("2. does not replace anything if the image property does not contain old widget names", () => {
    const widgetNameMap = {
      table1: "table1Copy",
    };

    const widget = {
      image: "{{table2.selectedRowData.image}}",
    };

    handleImageWidgetWhenPasting(widgetNameMap, widget as any);

    expect(widget.image).toBe("{{table2.selectedRowData.image}}");
  });

  it("3. handles empty widget name map", () => {
    const widgetNameMap = {};

    const widget = {
      image: "{{table1.selectedRowData.image}}",
    };

    handleImageWidgetWhenPasting(widgetNameMap, widget as any);

    expect(widget.image).toBe("{{table1.selectedRowData.image}}");
  });

  it("4. handles empty image property", () => {
    const widgetNameMap = {
      table1: "table1Copy",
    };

    const widget = {
      image: "",
    };

    handleImageWidgetWhenPasting(widgetNameMap, widget as any);

    expect(widget.image).toBe("");
  });
});

describe("handleTextWidgetWhenPasting", () => {
  it("1. should replace old widget names with new widget names in the widget text", () => {
    const widgetNameMap = {
      table1: "table1Copy",
    };

    const widget = {
      text: "{{table1.selectedRowData.name}}",
    };

    handleTextWidgetWhenPasting(widgetNameMap, widget as any);

    expect(widget.text).toBe("{{table1Copy.selectedRowData.name}}");
  });

  it("2. should not modify the widget text if there are no old widget names", () => {
    const widgetNameMap = {
      table1: "table1Copy",
    };

    const widget = {
      text: "{{table2.selectedRowData.name}}",
    };

    handleTextWidgetWhenPasting(widgetNameMap, widget as any);

    expect(widget.text).toBe("{{table2.selectedRowData.name}}");
  });

  it("3. should not modify the widget text if the widget name map is empty", () => {
    const widgetNameMap = {};

    const widget = {
      text: "{{table1.selectedRowData.name}}",
    };

    handleTextWidgetWhenPasting(widgetNameMap, widget as any);

    expect(widget.text).toBe("{{table1.selectedRowData.name}}");
  });
});
