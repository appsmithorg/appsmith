import { ObjectsRegistry } from "../Objects/Registry";

export class CanvasHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;
  private locators = {
    _widgetPaneCTA: "[data-cy='widget-page-cta']",
    _widgetPane: "[data-cy='widget-sidebar-scrollable-wrapper']",
  };

  public OpenWidgetPane() {
    const openPane = (ctaVisible: boolean) => {
      if (ctaVisible) {
        this.agHelper
          .DoesElementExist(this.locators._widgetPane)
          .then((exists) => {
            if (!exists) {
              this.agHelper.GetNClick(this.locators._widgetPaneCTA);
            }
          });
      } else {
        this.agHelper.GetNClick(this.commonLocators._openWidget);
      }
    };

    this.agHelper
      .DoesElementExist(this.locators._widgetPaneCTA)
      .then(openPane as any);
  }
}
