/* eslint-disable @typescript-eslint/no-explicit-any */
import { isString } from "lodash";
import type { DSLWidget } from "../types";
import { DATA_BIND_REGEX_GLOBAL } from "../utils";

function migrateTabsDataUsingMigrator(currentDSL: DSLWidget) {
  if (currentDSL.type === "TABS_WIDGET" && currentDSL.version === 1) {
    try {
      currentDSL.type = "TABS_MIGRATOR_WIDGET";
      currentDSL.version = 1;
    } catch (error) {
      currentDSL.tabsObj = {};
      delete currentDSL.tabs;
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(migrateTabsDataUsingMigrator);
  }

  return currentDSL;
}

export const migrateTabsData = (currentDSL: DSLWidget) => {
  if (
    ["TABS_WIDGET", "TABS_MIGRATOR_WIDGET"].includes(currentDSL.type) &&
    currentDSL.version === 1
  ) {
    try {
      currentDSL.type = "TABS_WIDGET";
      const isTabsDataBinded = isString(currentDSL.tabs);

      currentDSL.dynamicPropertyPathList =
        currentDSL.dynamicPropertyPathList || [];
      currentDSL.dynamicBindingPathList =
        currentDSL.dynamicBindingPathList || [];

      if (isTabsDataBinded) {
        const tabsString = currentDSL.tabs.replace(
          DATA_BIND_REGEX_GLOBAL,
          (word: any) => `"${word}"`,
        );

        try {
          currentDSL.tabs = JSON.parse(tabsString);
        } catch (error) {
          return migrateTabsDataUsingMigrator(currentDSL);
        }
        const dynamicPropsList = currentDSL.tabs
          .filter((each: any) => DATA_BIND_REGEX_GLOBAL.test(each.isVisible))
          .map((each: any) => {
            return { key: `tabsObj.${each.id}.isVisible` };
          });
        const dynamicBindablePropsList = currentDSL.tabs.map((each: any) => {
          return { key: `tabsObj.${each.id}.isVisible` };
        });

        currentDSL.dynamicPropertyPathList = [
          ...currentDSL.dynamicPropertyPathList,
          ...dynamicPropsList,
        ];
        currentDSL.dynamicBindingPathList = [
          ...currentDSL.dynamicBindingPathList,
          ...dynamicBindablePropsList,
        ];
      }

      currentDSL.dynamicPropertyPathList =
        currentDSL.dynamicPropertyPathList.filter((each: { key: string }) => {
          return each.key !== "tabs";
        });
      currentDSL.dynamicBindingPathList =
        currentDSL.dynamicBindingPathList.filter((each: { key: string }) => {
          return each.key !== "tabs";
        });
      currentDSL.tabsObj = currentDSL.tabs.reduce(
        (obj: any, tab: any, index: number) => {
          obj = {
            ...obj,
            [tab.id]: {
              ...tab,
              isVisible: tab.isVisible === undefined ? true : tab.isVisible,
              index,
            },
          };

          return obj;
        },
        {},
      );
      currentDSL.version = 2;
      delete currentDSL.tabs;
    } catch (error) {
      currentDSL.tabsObj = {};
      delete currentDSL.tabs;
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(migrateTabsData);
  }

  return currentDSL;
};
