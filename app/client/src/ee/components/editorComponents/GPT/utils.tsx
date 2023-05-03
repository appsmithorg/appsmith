import type { AppState } from "@appsmith/reducers";
import {
  isAction,
  isJSAction,
  isTrueObject,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import { createSelector } from "reselect";
import { getEntityInCurrentPath } from "sagas/RecentEntitiesSagas";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getActionsForCurrentPage } from "selectors/entitiesSelector";
import FuzzySet from "fuzzyset";

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

export const GPT_JS_EXPRESSION = {
  id: GPTTask.JS_EXPRESSION,
  desc: "Generate a JS expression that transforms your query/API data",
  title: "JS expression",
};

export const GPT_SQL_QUERY = {
  id: GPTTask.SQL_QUERY,
  title: "SQL query",
  desc: "Generate a SQL query",
};

export const GPT_TASKS = [GPT_JS_EXPRESSION, GPT_SQL_QUERY];

export const useGPTTasks = () => {
  const location = useLocation();
  const { pageType } = getEntityInCurrentPath(location.pathname);
  const GPT_TASKS = [GPT_JS_EXPRESSION, GPT_SQL_QUERY];
  if (pageType === "queryEditor") {
    GPT_TASKS.reverse();
  }
  return GPT_TASKS;
};

function getPotentialEntityNamesFromMessage(
  message: string,
  entityNames: string[],
) {
  const words = message
    .split(" ")
    .filter(Boolean)
    .map((word) => word?.toLowerCase());
  const set = FuzzySet(entityNames);
  const exactMatches = new Set<string>();
  const partialMatches: [number, string][] = [];
  for (const word of words) {
    const matches = set.get(word);
    if (!matches) continue;
    for (const match of matches) {
      const [score, entityName] = match;
      if (score === 1) {
        exactMatches.add(entityName);
      } else {
        partialMatches.push([score, entityName]);
      }
    }
  }
  const pMatches = Array.from(
    new Set(partialMatches.sort((a, b) => b[0] - a[0]).map((a) => a[1])),
  );

  return { exactMatches: Array.from(exactMatches), partialMatches: pMatches };
}

const getGPTContextGenerator = createSelector(getDataTree, (dataTree) => {
  return (entityName: string) => {
    const entity = dataTree[entityName];
    const context: TChatGPTContext = {};
    if (isAction(entity)) {
      context[entityName] = {
        data: getDataSkeleton(entity.data),
        run: "() => {}",
        type: "ACTION",
      };
    } else if (isWidget(entity)) {
      const widgetSkeleton = getDataSkeleton(entity);
      context[entityName] = { ...widgetSkeleton, type: "WIDGET" };
    } else if (isJSAction(entity)) {
      context[entityName] = {
        body: entity.body.replace(/export default/g, ""),
        type: "JS_ACTION",
      };
    }
    return context;
  };
});

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

function getDataSkeleton(data: unknown): any {
  if (!data) return {};
  if (Array.isArray(data)) {
    return [getDataSkeleton(data[0])];
  } else if (isTrueObject(data)) {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = getDataSkeleton(data[key]);
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

export const selectShowExamplePrompt = (state: AppState) =>
  state.ai.showExamplePrompt;

export const isUserPrompt = (prompt: TChatGPTPrompt): prompt is TUserPrompt =>
  prompt.role === "user";

export const isAssistantPrompt = (
  prompt: TChatGPTPrompt,
): prompt is TAssistantPrompt => prompt.role === "assistant";

export const isGPTErrorPrompt = (
  prompt: TChatGPTPrompt,
): prompt is TErrorPrompt => prompt.role === "error";

export function useChatScroll<T>(
  dep: T,
): React.MutableRefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dep]);
  return ref;
}
