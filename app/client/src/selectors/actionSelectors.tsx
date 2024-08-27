import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createSelector } from "reselect";
import WidgetFactory from "WidgetProvider/factory";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { JSLibrary } from "workers/common/JSLibrary";
import { getDataTree } from "./dataTreeSelectors";
import {
  getExistingPageNames,
  selectInstalledLibraries,
} from "ee/selectors/entitiesSelector";
import {
  getErrorForApiName,
  getErrorForJSObjectName,
  getIsSavingForApiName,
  getIsSavingForJSObjectName,
} from "./ui";
import { getParentWidget } from "./widgetSelectors";

/**
 * Selector to return names that are already taken by other api, js objects, pagenames etc.
 */
export const getUsedActionNames = createSelector(
  getExistingPageNames,
  getDataTree,
  getParentWidget,
  selectInstalledLibraries,
  (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pageNames: Record<string, any>,
    dataTree: DataTree,
    parentWidget: FlattenedWidgetProps | undefined,
    installedLibraries: JSLibrary[],
  ) => {
    const map: Record<string, boolean> = {};
    // The logic has been copied from Explorer/Entity/Name.tsx Component.
    // Todo(abhinav): abstraction leak
    if (
      parentWidget &&
      parentWidget.type === WidgetFactory.widgetTypes.TABS_WIDGET
    ) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.values(parentWidget.tabsObj).forEach((tab: any) => {
        map[tab.label] = true;
      });
    } else {
      pageNames.forEach((pageName: string) => {
        map[pageName] = true;
      });
      Object.keys(dataTree).forEach((treeItem: string) => {
        map[treeItem] = true;
      });
      const libAccessors = ([] as string[]).concat(
        ...installedLibraries.map((lib) => lib.accessor),
      );
      for (const accessor of libAccessors) {
        map[accessor] = true;
      }
    }

    return map;
  },
);

export const getSavingStatusForActionName = createSelector(
  getIsSavingForApiName,
  getErrorForApiName,
  (isSaving: boolean, error: boolean) => ({
    isSaving,
    error,
  }),
);

export const getSavingStatusForJSObjectName = createSelector(
  getIsSavingForJSObjectName,
  getErrorForJSObjectName,
  (isSaving: boolean, error: boolean) => ({
    isSaving,
    error,
  }),
);
