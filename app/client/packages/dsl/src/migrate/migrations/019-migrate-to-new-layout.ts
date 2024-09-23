import type { DSLWidget } from "../types";

const DEFAULT_GRID_ROW_HEIGHT = 10;
const GRID_DENSITY_MIGRATION_V1 = 4;

export const getCanvasSnapRows = (
  bottomRow: number,
  mobileBottomRow?: number,
  isMobile?: boolean,
  isAutoLayoutActive?: boolean,
): number => {
  const bottom =
    isMobile && mobileBottomRow !== undefined && isAutoLayoutActive
      ? mobileBottomRow
      : bottomRow;
  const totalRows = Math.floor(bottom / DEFAULT_GRID_ROW_HEIGHT);

  return isAutoLayoutActive ? totalRows : totalRows - 1;
};

export const migrateToNewLayout = (dsl: DSLWidget) => {
  const scaleWidget = (widgetProps: DSLWidget) => {
    widgetProps.bottomRow *= GRID_DENSITY_MIGRATION_V1;
    widgetProps.topRow *= GRID_DENSITY_MIGRATION_V1;
    widgetProps.leftColumn *= GRID_DENSITY_MIGRATION_V1;
    widgetProps.rightColumn *= GRID_DENSITY_MIGRATION_V1;

    if (widgetProps.children && widgetProps.children.length) {
      widgetProps.children.forEach((eachWidgetProp: DSLWidget) => {
        scaleWidget(eachWidgetProp);
      });
    }
  };

  scaleWidget(dsl);

  return dsl;
};
