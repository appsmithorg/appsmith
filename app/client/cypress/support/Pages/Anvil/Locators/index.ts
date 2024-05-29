import { MAIN_CONTAINER_WIDGET_ID } from "../../../../../src/constants/WidgetConstants";
import { getAnvilCanvasId } from "../../../../../src/layoutSystems/anvil/viewer/canvas/utils";
import { AnvilDataAttributes } from "../../../../../src/widgets/anvil/constants";

// anvil widget based selectors
const anvilWidgetSelector = "[data-testid=t--anvil-widget-wrapper]";
const anvilWidgetBasedSelectors = {
  anvilWidgetSelector,
  anvilWidgetNameSelector: (widgetName: string) => {
    return `[${AnvilDataAttributes.WIDGET_NAME}="${widgetName}"]`;
  },
  anvilSelectedWidget: `${anvilWidgetSelector}[data-selected=true]`,
  anvilWidgetTypeSelector: (widgetType: string) => {
    return `.t--widget-${widgetType}`;
  },
};

// sections and zones based selectors
const anvilSectionAndZonesBasedSelectors = {
  anvilZoneDistributionValue: "[data-testid=t--anvil-zone-distribution-value]",
  anvilSectionDistributionHandle: "[data-testid=t--anvil-distribution-handle]",
  anvilZoneStepperControlInputValue:
    ".t--property-control-zones .ads-v2-input__input-section-input",
  anvilZoneStepperControlSelector: (type: "add" | "remove") =>
    ".t--property-control-zones .ads-v2-input__input-section-icon-" +
    (type === "add" ? "end" : "start"),
};

// dnd based selectors
const anvilDnDBasedSelectors = {
  anvilDnDListener: "[data-type=anvil-dnd-listener]",
  mainCanvasSelector: `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`,
};

// wds and layout based widgets
const anvilWidgetsLocators = {
  WDSBUTTON: "wdsbuttonwidget",
  WDSTABLE: "wdstablewidget",
  WDSINPUT: "wdsinputwidget",
  WDSSWITCH: "wdsswitchwidget",
  WDSCHECKBOX: "wdscheckboxwidget",
  SECTION: "sectionwidget",
  ZONE: "zonewidget",
};

export const anvilLocators = {
  ...anvilWidgetBasedSelectors,
  ...anvilWidgetsLocators,
  ...anvilSectionAndZonesBasedSelectors,
  ...anvilDnDBasedSelectors,
};
