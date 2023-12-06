import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import type { PartialExportParams } from "sagas/WidgetSelectionSagas";
import type { JSLibrary } from "workers/common/JSLibrary";

export function selectOnlyParentIdsForSelectedWidgets(
  widget: CanvasStructure,
  ids: string[],
  finalWidgetIDs: string[] = [],
) {
  if (widget.widgetId && ids.includes(widget.widgetId)) {
    finalWidgetIDs.push(widget.widgetId);
    return finalWidgetIDs;
  }
  if (widget.children) {
    widget.children.forEach((child) => {
      selectOnlyParentIdsForSelectedWidgets(child, ids, finalWidgetIDs);
    });
  }
  return finalWidgetIDs;
}
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
    (result: string[][], key: string) => {
      if (key === "JS Objects") {
        result[0] = result[0].concat(
          groupedData[key].map((entity: any) => entity.entity.id),
        );
      } else {
        result[1] = result[1].concat(
          groupedData[key].map((entity: any) => entity.entity.id),
        );
      }
      return result;
    },
    [[], []],
  );
  const allWidgets =
    canvasWidgets?.children?.map((child) => child.widgetId) || [];

  const allCustomJSLibs =
    customJsLibraries.map((jsLib) => jsLib.id || "") || [];
  const allDatasources = appWideDS.map((ds) => ds.id) || [];
  return {
    jsObjects: allJSObjects,
    queries: allQueries,
    datasources: allDatasources,
    customJSLibs: allCustomJSLibs,
    widgets: allWidgets,
  };
}
