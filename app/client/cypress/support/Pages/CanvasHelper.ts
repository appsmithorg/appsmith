import { ObjectsRegistry } from "../Objects/Registry";

export class CanvasHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locators = {
    _widgetPaneCTA: "[data-cy='widget-page-cta']",
    _widgetPane: "[data-cy='widget-sidebar-scrollable-wrapper']",
  };

  public OpenWidgetPane() {
    const isOpen = this.agHelper.DoesElementExist(this.locators._widgetPane);
    if (!isOpen) {
      this.agHelper.GetNClick(this.locators._widgetPaneCTA);
    }
  }
}
