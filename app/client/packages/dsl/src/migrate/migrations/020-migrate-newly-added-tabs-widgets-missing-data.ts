/* eslint-disable @typescript-eslint/no-explicit-any */
import { has } from "lodash";
import type { DSLWidget } from "../types";

export const migrateNewlyAddedTabsWidgetsMissingData = (
  currentDSL: DSLWidget,
) => {
  if (currentDSL.type === "TABS_WIDGET" && currentDSL.version === 2) {
    try {
      if (currentDSL.children && currentDSL.children.length) {
        currentDSL.children = currentDSL.children.map((each: any) => {
          if (has(currentDSL, ["leftColumn", "rightColumn", "bottomRow"])) {
            return each;
          }

          return {
            ...each,
            leftColumn: 0,
            rightColumn:
              (currentDSL.rightColumn - currentDSL.leftColumn) *
              currentDSL.parentColumnSpace,
            bottomRow:
              (currentDSL.bottomRow - currentDSL.topRow) *
              currentDSL.parentRowSpace,
          };
        });
      }

      currentDSL.version = 3;
    } catch (error) {
      //   Sentry.captureException({
      //     message: "Tabs Migration to add missing fields Failed",
      //     oldData: currentDSL.children,
      //   });
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(
      migrateNewlyAddedTabsWidgetsMissingData,
    );
  }

  return currentDSL;
};
