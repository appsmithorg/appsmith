import WIDGET_CONFIG_RESPONSE from "./WidgetConfigResponse";

describe("WidgetConfigResponse", () => {
  it("it tests autocomplete child enhancements", () => {
    const mockProps = {
      childAutoComplete: "child-autocomplet",
    };

    expect(
      WIDGET_CONFIG_RESPONSE.config.LIST_WIDGET.enhancements.child.autocomplete(
        mockProps,
      ),
    ).toBe(mockProps.childAutoComplete);
  });

  it("it tests hideEvaluatedValue child enhancements", () => {
    expect(
      WIDGET_CONFIG_RESPONSE.config.LIST_WIDGET.enhancements.child.hideEvaluatedValue(),
    ).toBe(true);
  });

  it("it tests propertyUpdateHook child enhancements with undefined parent widget", () => {
    const mockParentWidget = {
      widgetId: undefined,
    };

    const result = WIDGET_CONFIG_RESPONSE.config.LIST_WIDGET.enhancements.child.propertyUpdateHook(
      mockParentWidget,
      "child-widget-name",
      "text",
      "value",
      false,
    );

    expect(result).toStrictEqual([]);
  });

  it("it tests propertyUpdateHook child enhancements with undefined parent widget", () => {
    const mockParentWidget = {
      widgetId: undefined,
    };

    const result = WIDGET_CONFIG_RESPONSE.config.LIST_WIDGET.enhancements.child.propertyUpdateHook(
      mockParentWidget,
      "child-widget-name",
      "text",
      "value",
      false,
    );

    expect(result).toStrictEqual([]);
  });

  it("it tests propertyUpdateHook child enhancements with defined parent widget", () => {
    const mockParentWidget = {
      widgetId: "parent-widget-id",
      widgetName: "parent-widget-name",
    };

    const result = WIDGET_CONFIG_RESPONSE.config.LIST_WIDGET.enhancements.child.propertyUpdateHook(
      mockParentWidget,
      "child-widget-name",
      "text",
      "value",
      false,
    );

    expect(result).toStrictEqual([
      {
        widgetId: "parent-widget-id",
        propertyPath: "template.child-widget-name.text",
        propertyValue: "{{parent-widget-name.items.map((currentItem) => )}}",
        isDynamicTrigger: false,
      },
    ]);
  });
});
