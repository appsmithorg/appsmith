import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import log from "loglevel";
import { call, select } from "redux-saga/effects";
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
    const suggestedEntityName: string = yield call(getNewActionName, props);
    const uniqueActionName = resolveEntityNameConflict(
      existingEntityNames,
      suggestedEntityName,
    );
    return uniqueActionName;
  }
}

function getNewWidgetName(
  props: Record<string, unknown>,
  widgetConfig: Record<string, string>,
): string {
  console.log("##### WidgetProps and Configs:", props, widgetConfig);
  return "testwidget";
}

async function getNewActionName(
  props: Record<string, unknown>,
): Promise<string> {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const request = new Request(
    "https://release-ai.appsmith.com/api/v1/assistant/query",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        params: {
          // Please remember to escape or remove quotes from the query
          input: `${props.body}  Please provide a name for this query in pascalcase. Limit the name to 30 characters.`,
          instructions:
            "Please provide a name for this query in pascalcase. Limit the name to 30 characters.",
        },
        usecase: "TEXT_GENERATE",
      }),
    },
  );

  const result = fetch(request)
    .then(async (response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      return response.response.replace(/[^a-zA-Z ]/g, "");
    })
    .catch((error) => {
      log.debug("##### AI Response Error:", error);
    });
  return result;
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
