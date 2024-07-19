import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import log from "loglevel";
import { call, select } from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import WidgetFactory from "WidgetProvider/factory";
import { WIDGET_NAME_MAP } from "./constants";
import { PluginType } from "entities/Action";
import { camelCase } from "lodash";

export function* getNewEntityName(
  entityType: string,
  props: Record<string, unknown>,
) {
  const dataTreeEntities: DataTree = yield select(getDataTree);
  const existingEntityNames = Object.keys(dataTreeEntities);

  if (entityType === ENTITY_TYPE.WIDGET) {
    const widgetConfig = WidgetFactory.getConfig(props.type as string);
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

export function getNewWidgetName(
  props: Record<string, unknown>,
  widgetConfig: any,
): string {
  const renameMap = WIDGET_NAME_MAP[props.type as keyof typeof WIDGET_NAME_MAP];
  const suffix = widgetConfig.widgetName;
  const prefix = props[renameMap[0]];

  return camelCase(`${prefix}${suffix}`);
}

async function getNewActionName(
  props: Record<string, unknown>,
): Promise<string> {
  let newActionName: string = props.name as string;
  if (props.pluginType === PluginType.DB) {
    newActionName = await getDBActionName(props);
  }

  if (props.pluginType === PluginType.API) {
    newActionName = await getAPIActionName(props);
  }

  return newActionName;
}

async function getAPIActionName(
  props: Record<string, unknown>,
): Promise<string> {
  const promisedAPIActionName: Promise<string> = new Promise(function (
    resolve,
  ) {
    const method = props.httpMethod as string;
    const path = props.path as string;
    const queries = props.queryParameters as Array<{
      key: string;
      value: string;
    }>;

    const fullString =
      `${METHOD_MAP[method]}${sanitizePath(path)}${suffixedQueryParameters(queries)}`.slice(
        0,
        30,
      );

    resolve(`${fullString}API`);
  });

  return promisedAPIActionName;
}

const METHOD_MAP: Record<string, string> = {
  POST: "Update",
  GET: "Fetch",
  PUT: "Add",
  DELETE: "Delete",
  PATCH: "Patch",
};

function sanitizePath(path: string) {
  const tokenized = path
    .split("/")
    .filter(Boolean)
    .filter((token: string) => Number.isNaN(parseInt(token, 10)));

  const capitalized = tokenized.map((token: string) => {
    const _token = token.toLowerCase();
    return _token[0].toUpperCase() + _token.substring(1);
  });
  // Eg: /user/1/addresses becomes UserAddresses
  if (capitalized.length === 0) return "";
  return `${capitalized.join("")}`;
}

function suffixedQueryParameters(
  queryParams: Array<{ key: string; value: string }>,
) {
  const queries = queryParams
    .map((entry) => (entry.key.length > 0 ? entry.key : undefined))
    .filter(Boolean) as string[];

  const capitalized = queries.map((param: string) => {
    const _param = param.toLowerCase();
    return _param[0].toUpperCase() + _param.substring(1);
  });

  if (capitalized.length === 0) return "";

  return `By${capitalized.join("And")}`;
}

async function getDBActionName(
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
          input: `${props.body} Please provide a name for this query in pascalcase in less than 20 characters. Suffix it with Query`,
          instructions:
            "Please provide a name for this query in pascalcase in less than 20 characters.",
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
