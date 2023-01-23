import { ObjectsRegistry } from "../Objects/Registry";

export class CanvasHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;
  private locators = {
    _widgetPaneCTA: "[data-cy='widget-page-cta']",
    _widgetPane: "[data-cy='widget-sidebar-scrollable-wrapper']",
  };

  public OpenWidgetPane() {
    const openPane = (isCTAVisible: boolean) => {
      if (isCTAVisible) {
        const widgetPaneVisible = this.agHelper.DoesElementExist(
          this.locators._widgetPane,
        );
        widgetPaneVisible.then((value) => {
          if (!value) {
            this.agHelper.GetNClick(this.locators._widgetPaneCTA);
          }
        });
      } else {
        this.agHelper.GetNClick(this.commonLocators._openWidget);
      }
    };

    const ctaVisible = this.agHelper.DoesElementExist(
      this.locators._widgetPaneCTA,
    );

    ctaVisible.then(openPane);
  }
}
