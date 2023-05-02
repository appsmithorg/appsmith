import type { AppState } from "@appsmith/reducers";
import {
  isAction,
  isJSAction,
  isTrueObject,
  isWidget,
} from "ce/workers/Evaluation/evaluationUtils";
import Fuse from "fuse.js";
import { find } from "lodash";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import { createSelector } from "reselect";
import { getEntityInCurrentPath } from "sagas/RecentEntitiesSagas";
import { getWidgets } from "sagas/selectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
} from "selectors/entitiesSelector";

export type TUserPrompt = {
  role: "user";
  content: string;
  task: GPTTask;
};

export type TAssistantPrompt = {
  role: "assistant";
  content: string;
  messageId: string;
  liked?: boolean;
  task: GPTTask;
};

export type TErrorPrompt = {
  role: "error";
  content: string;
  task: GPTTask;
};

export type TChatGPTPrompt = TAssistantPrompt | TUserPrompt | TErrorPrompt;

export type TChatGPTContext = Record<string, unknown>;

export enum GPTTask {
  JS_EXPRESSION = "JS_EXPR",
  JS_FUNCTION = "JS_FUNC",
  SQL_QUERY = "SQL",
  REFACTOR_CODE = "REFACTOR_CODE",
}

export const GPT_TASKS = [
  {
    id: GPTTask.JS_EXPRESSION,
    desc: "Generate a JS expression that transforms your query/API data",
    title: "JS expression",
    disabled: (pageType: string) => !["canvas", "jsEditor"].includes(pageType),
  },
  {
    id: GPTTask.JS_FUNCTION,
    title: "JS function",
    desc: "Generate a JS function that contains your workflow logic and data transformations",
    disabled: (pageType: string) => !["canvas", "jsEditor"].includes(pageType),
  },
  {
    id: GPTTask.SQL_QUERY,
    title: "SQL query",
    desc: "Generate a SQL query",
    disabled: (pageType: string) => pageType !== "queryEditor",
  },
];

export const useGPTTasks = () => {
  const location = useLocation();
  const { pageType } = getEntityInCurrentPath(location.pathname);
  return useMemo(() => {
    return GPT_TASKS.map((task) => {
      return {
        ...task,
        disabled: task.disabled(pageType || ""),
      };
    });
  }, [pageType]);
};

function getPotentialEntityNamesFromMessage(
  message: string,
  entityNames: string[],
) {
  const words = message
    .split(" ")
    .filter(Boolean)
    .map((word) => word?.toLowerCase());
  const fuse = new Fuse(words, {
    isCaseSensitive: true,
    includeScore: true,
    threshold: 0.6,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });
  const exactMatches = [];
  const partialMatches = [];
  for (const name of entityNames) {
    const results = fuse.search(name);
    if (results.length) {
      const [match] = results;
      if (match.score === 0) {
        exactMatches.push(name);
      } else {
        partialMatches.push(name);
      }
    }
  }

  return { exactMatches, partialMatches };
}

const getGPTContextGenerator = createSelector(
  getDataTree,
  getWidgets,
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  (dataTree, widgets, actions, jsCollections) => {
    return (entityName: string) => {
      const entity = dataTree[entityName];
      const context: TChatGPTContext = {};
      if (isAction(entity)) {
        const action = actions.find((a) => a.config.name === entityName);
        context[entityName] = {
          data: getActionData(action?.data?.body),
          run: "() => {}",
          type: "ACTION",
        };
      } else if (isWidget(entity)) {
        const widget = find(
          Object.values(widgets),
          (widget) => widget.widgetName === entityName,
        );
        context[entityName] = { ...widget, type: "WIDGET" };
      } else if (isJSAction(entity)) {
        const jsAction = jsCollections.find(
          (a) => a.config.name === entityName,
        );
        context[entityName] = {
          body: jsAction?.config.body.replace(/export default/g, ""),
          type: "JS_ACTION",
        };
      }
      return context;
    };
  },
);

export function useGPTContextGenerator() {
  const dataTree = useSelector(getDataTree);
  const contextGenerator = useSelector(getGPTContextGenerator);
  const location = useLocation();
  const actions = useSelector(getActionsForCurrentPage);
  const generator = useMemo(
    () => (prompt: TChatGPTPrompt) => {
      if (prompt?.role !== "user") return {};
      const query = prompt.content;
      if (!query) return {};
      const entityNames = Object.keys(dataTree);
      const { exactMatches, partialMatches } =
        getPotentialEntityNamesFromMessage(query, entityNames);
      const entityNamesFromMessage = exactMatches.length
        ? exactMatches
        : partialMatches.slice(0, 2);
      const api_context = entityNamesFromMessage.reduce((acc, entityName) => {
        acc = { ...acc, ...contextGenerator(entityName) };
        return acc;
      }, {} as any);
      const { id, pageType } = getEntityInCurrentPath(location.pathname);
      const meta: any = {};
      if (pageType === "queryEditor") {
        const query = actions.find((a) => a.config.id === id);
        const datasourceId = (query?.config?.datasource as any)?.id;
        meta["datasourceId"] = datasourceId;
      }
      return {
        api_context,
        meta,
      };
    },
    [dataTree, contextGenerator, location.pathname, actions],
  );
  return generator;
}

function getActionData(data: unknown): any {
  if (!data) return {};
  if (Array.isArray(data)) {
    return [getActionData(data[0])];
  } else if (isTrueObject(data)) {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = getActionData(data[key]);
      return acc;
    }, {} as any);
  } else {
    return typeof data;
  }
}

export const selectIsAIWindowOpen = (state: AppState) =>
  state.ai.isAIWindowOpen;

export const selectEvaluatedResult = (messageId: string) => (state: AppState) =>
  state.ai.evaluationResults[messageId];

export const selectGPTMessages = (state: AppState) => state.ai.messages;

export const isUserPrompt = (prompt: TChatGPTPrompt): prompt is TUserPrompt =>
  prompt.role === "user";

export const isAssistantPrompt = (
  prompt: TChatGPTPrompt,
): prompt is TAssistantPrompt => prompt.role === "assistant";

export const isGPTErrorPrompt = (
  prompt: TChatGPTPrompt,
): prompt is TErrorPrompt => prompt.role === "error";
