import WIDGET_CONFIG_RESPONSE from "./WidgetConfigResponse";

describe("WidgetConfigResponse", () => {
  it("it checks if config contains list widget", () => {
    expect(WIDGET_CONFIG_RESPONSE.config).toHaveProperty("LIST_WIDGET");
  });
});
