import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { select } from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import WidgetFactory from "WidgetProvider/factory";

export function* getNewEntityName(
  entityType: string,
  props: Record<string, unknown>,
) {
  const dataTreeEntities: DataTree = yield select(getDataTree);
  const existingEntityNames = Object.keys(dataTreeEntities);

  if (entityType === ENTITY_TYPE.WIDGET) {
    const widgetConfig = WidgetFactory.getWidgetDefaultPropertiesMap(
      props.type as string,
    );
    const suggestedEntityName: string = getNewWidgetName(props, widgetConfig);
    const uniqueWidgetName = resolveEntityNameConflict(
      existingEntityNames,
      suggestedEntityName,
    );
    return uniqueWidgetName;
  }

  if (entityType === ENTITY_TYPE.ACTION) {
    const suggestedActionName: string = getNewActionName(props);
    const uniqueActionName = resolveEntityNameConflict(
      existingEntityNames,
      suggestedActionName,
    );
    return uniqueActionName;
  }
}

function getNewWidgetName(
  props: Record<string, unknown>,
  widgetConfig: Record<string, string>,
): string {
  console.log("##### WidgetProps and Configs:", props, widgetConfig);
  return "";
}

function getNewActionName(props: Record<string, unknown>): string {
  console.log("##### Action:", props);
  return "";
}

// TODO(abhinav): Optimise this by breaking the recursion and using iteration
function resolveEntityNameConflict(
  existingEntityNames: string[],
  suggestedEntityName: string,
): string {
  const indexOfConflictingEntityName =
    existingEntityNames.indexOf(suggestedEntityName);
  if (indexOfConflictingEntityName > -1) {
    let conflictingName: string = suggestedEntityName;
    const regexForNumericSuffix = /\d+$/g;
    const numericSuffixMatches = conflictingName.match(regexForNumericSuffix);

    if (numericSuffixMatches !== null) {
      const numericSuffix: number = parseInt(numericSuffixMatches[0], 10);
      const newSuffix: number = numericSuffix + 1;

      const nonSuffixedName: string = conflictingName.slice(
        0,
        conflictingName.length - numericSuffixMatches[0].length,
      );

      conflictingName = `${nonSuffixedName}${newSuffix.toString()}`;
    } else {
      conflictingName = `${conflictingName}1`;
    }
    const resolvedEntityName: string = resolveEntityNameConflict(
      existingEntityNames,
      conflictingName,
    );
    return resolvedEntityName;
  }
  return suggestedEntityName;
}
