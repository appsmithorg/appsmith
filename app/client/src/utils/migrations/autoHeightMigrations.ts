import { ALL_WIDGETS_AND_CONFIG } from "utils/WidgetRegistry";
import {
  RegisteredWidgetFeatures,
  WidgetFeatureProps,
} from "utils/WidgetFeatures";
import { compact } from "lodash";
import { DSLWidget } from "widgets/constants";
export const migratePropertiesForDynamicHeight = (currentDSL: DSLWidget) => {
  const widgetsWithDynamicHeight = compact(
    ALL_WIDGETS_AND_CONFIG.map(([, config]) => {
      if (config.features?.dynamicHeight) return config.type;
    }),
  );
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
