/* eslint-disable @typescript-eslint/no-explicit-any */
import { omit, omitBy } from "lodash";
import type { DSLWidget } from "../types";

const MAIN_CONTAINER_WIDGET_ID = "0";

/**
 * this function gets the next available row for pasting widgets
 * NOTE: this function excludes modal widget when calculating next available row
 *
 * @param parentContainerId
 * @param canvasWidgets
 * @returns
 */
const nextAvailableRowInContainer = (
  parentContainerId: string,
  canvasWidgets: any,
) => {
  const filteredCanvasWidgets = omitBy(canvasWidgets, (widget) => {
    return widget.type === "MODAL_WIDGET";
  });

  return (
    Object.values(filteredCanvasWidgets).reduce(
      (prev: number, next: any) =>
        next?.parentId === parentContainerId && next.bottomRow > prev
          ? next.bottomRow
          : prev,
      0,
    ) + 1
  );
};

export const migrateWidgetsWithoutLeftRightColumns = (
  currentDSL: DSLWidget,
  canvasWidgets: any,
) => {
  if (
    currentDSL.widgetId !== MAIN_CONTAINER_WIDGET_ID &&
    !(
      currentDSL.hasOwnProperty("leftColumn") &&
      currentDSL.hasOwnProperty("rightColumn")
    )
  ) {
    try {
      const nextRow = nextAvailableRowInContainer(
        currentDSL.parentId || MAIN_CONTAINER_WIDGET_ID,
        omit(canvasWidgets, [currentDSL.widgetId]),
      );

      canvasWidgets[currentDSL.widgetId].repositioned = true;
      const leftColumn = 0;
      // TODO(abhinav): Figure out a way to get the correct values from the widgets
      const rightColumn = 4;
      const bottomRow = nextRow + (currentDSL.bottomRow - currentDSL.topRow);
      const topRow = nextRow;

      currentDSL = {
        ...currentDSL,
        topRow,
        bottomRow,
        rightColumn,
        leftColumn,
      };
    } catch (error) {
      // Sentry.captureException({
      //   message: "Migrating position of widget on data loss failed",
      //   oldData: currentDSL,
      // });
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((dsl: DSLWidget) =>
      migrateWidgetsWithoutLeftRightColumns(dsl, canvasWidgets),
    );
  }

  return currentDSL;
};

export const migrateOverFlowingTabsWidgets = (
  currentDSL: DSLWidget,
  canvasWidgets: any,
) => {
  if (
    currentDSL.type === "TABS_WIDGET" &&
    currentDSL.version === 3 &&
    currentDSL.children &&
    currentDSL.children.length
  ) {
    const tabsWidgetHeight =
      (currentDSL.bottomRow - currentDSL.topRow) * currentDSL.parentRowSpace;
    const widgetHasOverflowingChildren = currentDSL.children.some(
      (eachTab: DSLWidget) => {
        if (eachTab.children && eachTab.children.length) {
          return eachTab.children.some((child: DSLWidget) => {
            if (canvasWidgets[child.widgetId].repositioned) {
              const tabHeight = child.bottomRow * child.parentRowSpace;

              return tabsWidgetHeight < tabHeight;
            }

            return false;
          });
        }

        return false;
      },
    );

    if (widgetHasOverflowingChildren) {
      currentDSL.shouldScrollContents = true;
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((eachChild: DSLWidget) =>
      migrateOverFlowingTabsWidgets(eachChild, canvasWidgets),
    );
  }

  return currentDSL;
};
