import { MAIN_CONTAINER_WIDGET_ID } from "../../../../src/constants/WidgetConstants";
import { getAnvilCanvasId } from "../../../../src/layoutSystems/anvil/viewer/canvas/utils";
import { AnvilDataAttributes } from "../../../../src/widgets/anvil/constants";
import { locators } from "../../Objects/ObjectsCore";

const anvilWidgetSelector = "[data-testid=t--anvil-widget-wrapper]";
const anvilWidgetNameSelector = (widgetName: string) => {
  return `[${AnvilDataAttributes.WIDGET_NAME}="${widgetName}"]`;
};
const anvilZoneStepperControlSelector = (type: "add" | "remove") =>
  ".t--property-control-zones .ads-v2-input__input-section-icon-" +
  (type === "add" ? "end" : "start");

export const AnvilSelectors = {
  anvilWidgetSelector,
  anvilSelectedWidget: `${anvilWidgetSelector}[data-selected=true]`,
  anvilDnDListener: "[data-type=anvil-dnd-listener]",
  anvilWidgetInCanvas: locators._widgetInDeployed,
  mainCanvasSelector: `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`,
  anvilZoneStepperControlInputValue:
    ".t--property-control-zones .ads-v2-input__input-section-input",
  anvilWidgetNameSelector,
  anvilWidgetTypeSelector: locators._widgetInDeployed,
  anvilZoneStepperControlSelector,
};
