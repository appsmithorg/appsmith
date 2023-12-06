import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import type { PartialExportParams } from "sagas/WidgetSelectionSagas";
import type { JSLibrary } from "workers/common/JSLibrary";

export function groupQueriesNJSObjets(files: any): Record<string, any> {
  const groupedData: Record<string, any> = {};
  let currentGroup: unknown = null;

  for (const item of files) {
    if (item.type === "group") {
      currentGroup = item.entity.name;
      groupedData[currentGroup as string] = [];
    } else if (currentGroup) {
      groupedData[currentGroup as string].push(item);
    }
  }
  return groupedData;
}

// method to export everything
export function getAllExportableIds(
  files: any,
  canvasWidgets: CanvasStructure,
  customJsLibraries: JSLibrary[],
  appWideDS: any[],
): PartialExportParams {
  const groupedData: Record<string, any> = groupQueriesNJSObjets(files);

  const [allJSObjects, allQueries] = Object.keys(groupedData).reduce(
    (result: any[], key: string) => {
      if (key === "JS Objects") {
        return result[0].concat(
          groupedData[key].map((entity: any) => entity.entity.id),
        );
      } else {
        return result[1].concat(
          groupedData[key].map((entity: any) => entity.entity.id),
        );
      }
    },
    [[], []],
  );
  const allWidgets =
    canvasWidgets?.children?.map((child) => child.widgetId) || [];

  const allCustomJSLibs =
    customJsLibraries.map((jsLib) => jsLib.id || "") || [];
  const allDatasources = appWideDS || [];
  return {
    jsObjects: allJSObjects,
    queries: allQueries,
    datasources: allDatasources,
    customJSLibs: allCustomJSLibs,
    widgets: allWidgets,
  };
}
