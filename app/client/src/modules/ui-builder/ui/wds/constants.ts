import { getCanvasClassName } from "../../../../utils/generators";

export const anvilWidgets = {
  SECTION_WIDGET: "SECTION_WIDGET",
  ZONE_WIDGET: "ZONE_WIDGET",
};

export enum Elevations {
  SECTION_ELEVATION = 1,
  ZONE_ELEVATION = 2,
  CARD_ELEVATION = 3,
}

/**
 * The data attribute that will be used to identify the anvil widget name in the DOM.
 */
export const AnvilDataAttributes = {
  MODAL_SIZE: "data-size",
  WIDGET_NAME: "data-widget-name",
  IS_SELECTED_WIDGET: "data-selected",
};

/**
 * The default values that will be applied to all widgets.
 * This is the default for the API that allows widgets to define their selection and focus colors.
 */
export const DEFAULT_WIDGET_ON_CANVAS_UI = {
  selectionBGCSSVar: "--on-canvas-ui-widget-selection",
  focusBGCSSVar: "--on-canvas-ui-widget-focus",
  selectionColorCSSVar: "--on-canvas-ui-widget-focus",
  focusColorCSSVar: "--on-canvas-ui-widget-selection",
  disableParentSelection: false,
};

export const WDS_V2_WIDGET_MAP = {
  BUTTON_WIDGET: "WDS_BUTTON_WIDGET",
  INPUT_WIDGET_V2: "WDS_INPUT_WIDGET",
  CHECKBOX_WIDGET: "WDS_CHECKBOX_WIDGET",
  ICON_BUTTON_WIDGET: "WDS_ICON_BUTTON_WIDGET",
  TEXT_WIDGET: "WDS_PARAGRAPH_WIDGET",
  // Note: adding TEXT_WIDGET_V2 as we can't have keys with same name
  TEXT_WIDGET_V2: "WDS_HEADING_WIDGET",
  TABLE_WIDGET_V2: "WDS_TABLE_WIDGET",
  CURRENCY_INPUT_WIDGET: "WDS_CURRENCY_INPUT_WIDGET",
  BUTTON_GROUP_WIDGET: "WDS_TOOLBAR_BUTTONS_WIDGET",
  PHONE_INPUT_WIDGET: "WDS_PHONE_INPUT_WIDGET",
  CHECKBOX_GROUP_WIDGET: "WDS_CHECKBOX_GROUP_WIDGET",
  SWITCH_WIDGET: "WDS_SWITCH_WIDGET",
  SWITCH_GROUP_WIDGET: "WDS_SWITCH_GROUP_WIDGET",
  RADIO_GROUP_WIDGET: "WDS_RADIO_GROUP_WIDGET",
  MENU_BUTTON_WIDGET: "WDS_MENU_BUTTON_WIDGET",
  MODAL_WIDGET: "WDS_MODAL_WIDGET",
  STATBOX_WIDGET: "WDS_STATS_WIDGET",
  KEY_VALUE_WIDGET: "WDS_KEY_VALUE_WIDGET",
  INLINE_BUTTONS_WIDGET: "WDS_INLINE_BUTTONS_WIDGET",
  EMAIL_INPUT_WIDGET: "WDS_EMAIL_INPUT_WIDGET",
  PASSWORD_INPUT_WIDGET: "WDS_PASSWORD_INPUT_WIDGET",
  NUMBER_INPUT_WIDGET: "WDS_NUMBER_INPUT_WIDGET",
  MULTILINE_INPUT_WIDGET: "WDS_MULTILINE_INPUT_WIDGET",
  WDS_SELECT_WIDGET: "WDS_SELECT_WIDGET",
  WDS_COMBOBOX_WIDGET: "WDS_COMBOBOX_WIDGET",
  WDS_DATEPICKER_WIDGET: "WDS_DATEPICKER_WIDGET",

  // Anvil layout widgets
  ZONE_WIDGET: anvilWidgets.ZONE_WIDGET,
};
// getCanvasClassName adds class name to denote that this is scrollable canvas
export const WDS_MODAL_WIDGET_CLASSNAME = `appsmith-modal-body ${getCanvasClassName()}`;
