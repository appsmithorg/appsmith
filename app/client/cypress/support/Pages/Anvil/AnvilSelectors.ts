import { MAIN_CONTAINER_WIDGET_ID } from "../../../../src/constants/WidgetConstants";
import { getAnvilCanvasId } from "../../../../src/layoutSystems/anvil/viewer/canvas/utils";
import { AnvilDataAttributes } from "../../../../src/widgets/anvil/constants";
import { ObjectsRegistry } from "../../Objects/Registry";

export class AnvilSelectors {
  public anvilWidgetSelector = "[data-testid=t--anvil-widget-wrapper]";
  public anvilSelectedWidget = `${this.anvilWidgetSelector}[data-selected=true]`;
  public mainCanvasSelector = `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`;
  private locators = ObjectsRegistry.CommonLocators;
  public anvilWidgetNameSelector(widgetName: string) {
    return `[${AnvilDataAttributes.WIDGET_NAME}="${widgetName}"]`;
  }

  public anvilWidgetTypeSelector = this.locators._widgetInDeployed;
  public anvilZoneStepperControlSelector = (type: "add" | "remove") =>
    ".t--property-control-zones .ads-v2-input__input-section-icon-" +
    (type === "add" ? "end" : "start");
  public anvilZoneStepperControlInputValue =
    ".t--property-control-zones .ads-v2-input__input-section-input";
}
