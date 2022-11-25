import {
  RegisteredWidgetFeatures,
  WidgetFeatureProps,
} from "utils/WidgetFeatures";
import { DSLWidget } from "widgets/constants";
export const migratePropertiesForDynamicHeight = (currentDSL: DSLWidget) => {
  /*  const widgetsWithDynamicHeight = compact(
    ALL_WIDGETS_AND_CONFIG.map(([, config]) => {
      if (config.features?.dynamicHeight) return config.type;
    }),
  ); */
  // Ideally the above should be the code, however,
  // there seems to be some cyclic imports which
  // cause the test to fail in CI.
  const widgetsWithDynamicHeight = [
    "CONTAINER_WIDGET",
    "TEXT_WIDGET",
    "CHECKBOX_WIDGET",
    "RADIO_GROUP_WIDGET",
    "TABS_WIDGET",
    "MODAL_WIDGET",
    "RICH_TEXT_EDITOR_WIDGET",
    "DATE_PICKER_WIDGET2",
    "SWITCH_WIDGET",
    "FORM_WIDGET",
    "RATE_WIDGET",
    "CHECKBOX_GROUP_WIDGET",
    "STATBOX_WIDGET",
    "MULTI_SELECT_TREE_WIDGET",
    "SINGLE_SELECT_TREE_WIDGET",
    "SWITCH_GROUP_WIDGET",
    "SELECT_WIDGET",
    "MULTI_SELECT_WIDGET_V2",
    "INPUT_WIDGET_V2",
    "PHONE_INPUT_WIDGET",
    "CURRENCY_INPUT_WIDGET",
    "JSON_FORM_WIDGET",
  ];
  if (widgetsWithDynamicHeight.includes(currentDSL.type)) {
    currentDSL = {
      ...currentDSL,
      ...WidgetFeatureProps[RegisteredWidgetFeatures.DYNAMIC_HEIGHT],
    };
  }
  if (Array.isArray(currentDSL.children)) {
    currentDSL.children = currentDSL.children.map(
      migratePropertiesForDynamicHeight,
    );
  }
  return currentDSL;
};
