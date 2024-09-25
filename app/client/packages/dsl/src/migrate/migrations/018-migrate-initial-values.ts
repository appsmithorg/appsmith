import type { DSLWidget } from "../types";

export const migrateInitialValues = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "INPUT_WIDGET") {
      child = {
        isRequired: false,
        isDisabled: false,
        resetOnSubmit: false,
        ...child,
      };
    } else if (child.type === "DROP_DOWN_WIDGET") {
      child = {
        isRequired: false,
        isDisabled: false,
        ...child,
      };
    } else if (child.type === "DATE_PICKER_WIDGET2") {
      child = {
        minDate: "2001-01-01 00:00",
        maxDate: "2041-12-31 23:59",
        isRequired: false,
        ...child,
      };
    } else if (child.type === "SWITCH_WIDGET") {
      child = {
        isDisabled: false,
        ...child,
      };
    } else if (child.type === "ICON_WIDGET") {
      child = {
        isRequired: false,
        ...child,
      };
    } else if (child.type === "VIDEO_WIDGET") {
      child = {
        isRequired: false,
        isDisabled: false,
        ...child,
      };
    } else if (child.type === "CHECKBOX_WIDGET") {
      child = {
        isDisabled: false,
        isRequired: false,
        ...child,
      };
    } else if (child.type === "RADIO_GROUP_WIDGET") {
      child = {
        isDisabled: false,
        isRequired: false,
        ...child,
      };
    } else if (child.type === "FILE_PICKER_WIDGET") {
      child = {
        isDisabled: false,
        isRequired: false,
        allowedFileTypes: [],
        ...child,
      };
    } else if (child.children && child.children.length > 0) {
      child = migrateInitialValues(child);
    }

    return child;
  });

  return currentDSL;
};
