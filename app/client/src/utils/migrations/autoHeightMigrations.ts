import {
  RegisteredWidgetFeatures,
  WidgetFeatureProps,
} from "utils/WidgetFeatures";
import { traverseDSLAndMigrate } from "utils/WidgetMigrationUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "widgets/constants";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { InputTypes } from "widgets/BaseInputWidget/constants";
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

export function migrateListWidgetChildrenForAutoHeight(
  currentDSL: DSLWidget,
  isChildOfListWidget = false,
): DSLWidget {
  if (!currentDSL) return currentDSL;

  let isCurrentListWidget = false;
  if (currentDSL.type === "LIST_WIDGET") isCurrentListWidget = true;

  //Iterate and recursively call each children
  const children = currentDSL.children?.map((childDSL: DSLWidget) =>
    migrateListWidgetChildrenForAutoHeight(
      childDSL,
      isCurrentListWidget || isChildOfListWidget,
    ),
  );

  let newDSL;
  // Add dynamicHeight to FIXED for each of it's children
  if (isChildOfListWidget && !currentDSL.detachFromLayout) {
    newDSL = {
      ...currentDSL,
      dynamicHeight: "FIXED",
    };
  } else {
    newDSL = {
      ...currentDSL,
    };
  }

  if (children) {
    newDSL.children = children;
  }

  return newDSL;
}

export function migrateInputWidgetsMultiLineInputType(
  currentDSL: DSLWidget,
): DSLWidget {
  if (!currentDSL) return currentDSL;

  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "INPUT_WIDGET_V2") {
      const minInputSingleLineHeight =
        widget.label || widget.tooltip
          ? // adjust height for label | tooltip extra div
            GRID_DENSITY_MIGRATION_V1 + 4
          : // GRID_DENSITY_MIGRATION_V1 used to adjust code as per new scaled canvas.
            GRID_DENSITY_MIGRATION_V1;
      const isMultiLine =
        (widget.bottomRow - widget.topRow) / minInputSingleLineHeight > 1 &&
        widget.inputType === InputTypes.TEXT;

      if (isMultiLine) {
        widget.inputType = InputTypes.MULTI_LINE_TEXT;
      }
    }
  });
}
