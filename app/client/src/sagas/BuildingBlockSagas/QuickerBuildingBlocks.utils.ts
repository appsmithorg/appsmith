import { selectFilesForExplorer } from "@appsmith/selectors/entitiesSelector";
import _ from "lodash";
import { select } from "redux-saga/effects";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";

export function accessNestedObjectValue(obj: any, path: string) {
  return _.get(obj, path, "");
}
function extractWords(inputString: string) {
  const regex = /\w+/g;
  const words = inputString.match(regex);
  return words || [];
}

export function extractTokensFromBindings(widgetsDSL: FlattenedWidgetProps) {
  const tokenSet = new Set<string>();
  const paths = [
    ...(widgetsDSL.dynamicTriggerPathList || []),
    ...(widgetsDSL.dynamicBindingPathList || []),
    ...(widgetsDSL.dynamicPropertyPathList || []),
  ];

  paths.forEach((path: { key: string }) => {
    const words = extractWords(accessNestedObjectValue(widgetsDSL, path.key));
    words.forEach((word) => tokenSet.add(word));
  });

  return tokenSet;
}

export function* getRelatedEntities(widgetsDSL: FlattenedWidgetProps) {
  const tokens = extractTokensFromBindings(widgetsDSL);
  const jsObjectIds = new Set<string>();
  const queryIds = new Set<string>();
  const dbNames = new Set<string>();
  const files: { type: string; group: string; entity: any }[] = yield select(
    selectFilesForExplorer,
  );
  files.forEach((group) => {
    switch (group.type) {
      case "group":
        break;
      default:
        if (tokens.has(group.entity.name)) {
          if (group.type === "JS") {
            jsObjectIds.add(group.entity.id);
          } else {
            queryIds.add(group.entity.id);
            dbNames.add(group.group);
          }
        }
        break;
    }
  });
  return {
    jsObjectIds: Array.from(jsObjectIds),
    queryIds: Array.from(queryIds),
    dbNames: Array.from(dbNames),
  };
}

export const getBoundaryWidgetsFromCopiedWidgets = function (
  copiedWidgets: FlattenedWidgetProps[],
) {
  let left = 1000000,
    right = -1,
    top = 100000,
    bottom = -1;
  copiedWidgets.forEach((widget) => {
    left = Math.min(left, widget.leftColumn);
    right = Math.max(right, widget.rightColumn);
    top = Math.min(top, widget.topRow);
    bottom = Math.max(bottom, widget.bottomRow);
  });
  return {
    totalWidth: right - left,
    totalHeight: bottom - top,
  };
};
