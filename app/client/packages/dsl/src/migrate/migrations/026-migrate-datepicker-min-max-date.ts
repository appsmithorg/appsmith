import type { DSLWidget } from "../types";

export const migrateDatePickerMinMaxDate = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "DATE_PICKER_WIDGET2" && currentDSL.version === 2) {
    if (currentDSL.minDate === "2001-01-01 00:00") {
      currentDSL.minDate = "1920-12-31T18:30:00.000Z";
    }

    if (currentDSL.maxDate === "2041-12-31 23:59") {
      currentDSL.maxDate = "2121-12-31T18:29:00.000Z";
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children.map((eachWidgetDSL: DSLWidget) => {
      migrateDatePickerMinMaxDate(eachWidgetDSL);
    });
  }

  return currentDSL;
};
