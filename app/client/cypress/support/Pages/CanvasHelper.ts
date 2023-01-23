import { ObjectsRegistry } from "../Objects/Registry";

export class CanvasHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locators = {
    _widgetPaneCTA: "[data-cy='widget-page-cta']",
    _widgetPane: "[data-cy='widget-sidebar-scrollable-wrapper']",
  };

  public OpenWidgetPane() {
    this.agHelper.DoesElementExist(this.locators._widgetPane).then((exists) => {
      if (!exists) {
        this.agHelper.GetNClick(this.locators._widgetPaneCTA);
      }
    });
  }
}
