import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { createSelector } from "reselect";
import WidgetFactory from "utils/WidgetFactory";
import type { FlattenedWidgetProps } from "widgets/constants";
import type { TJSLibrary } from "workers/common/JSLibrary";
import { getDataTree } from "./dataTreeSelectors";
import {
  getExistingPageNames,
  selectInstalledLibraries,
} from "./entitiesSelector";
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
    pageNames: Record<string, any>,
    dataTree: DataTree,
    parentWidget: FlattenedWidgetProps | undefined,
    installedLibraries: TJSLibrary[],
  ) => {
    const map: Record<string, boolean> = {};
    // The logic has been copied from Explorer/Entity/Name.tsx Component.
    // Todo(abhinav): abstraction leak
    if (
      parentWidget &&
      parentWidget.type === WidgetFactory.widgetTypes.TABS_WIDGET
    ) {
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
