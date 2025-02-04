/* eslint-disable @typescript-eslint/no-explicit-any */
import { isString } from "lodash";
import log from "loglevel";
import type { DSLWidget } from "../types";

export const tabsWidgetTabsPropertyMigration = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children
    ?.filter(Boolean)
    .map((child: DSLWidget) => {
      if (child.type === "TABS_WIDGET") {
        try {
          const tabs = isString(child.tabs)
            ? JSON.parse(child.tabs)
            : child.tabs;
          const newTabs = tabs.map((tab: any) => {
            const childForTab = child.children
              ?.filter(Boolean)
              .find((tabChild: DSLWidget) => tabChild.tabId === tab.id);

            if (childForTab) {
              tab.widgetId = childForTab.widgetId;
            }

            return tab;
          });

          child.tabs = JSON.stringify(newTabs);
        } catch (migrationError) {
          log.debug({ migrationError });
        }
      }

      if (child.children && child.children.length) {
        child = tabsWidgetTabsPropertyMigration(child);
      }

      return child;
    });

  return currentDSL;
};
