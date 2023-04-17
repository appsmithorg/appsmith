import {
  isAction,
  isJSAction,
  isWidget,
} from "ce/workers/Evaluation/evaluationUtils";
import { find, isArray } from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import { getEntityInCurrentPath } from "sagas/RecentEntitiesSagas";
import { getWidgets } from "sagas/selectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
} from "selectors/entitiesSelector";
import usePrevious from "utils/hooks/usePrevious";

export type TChatGPTPrompt = {
  role: "user" | "system" | "assistant";
  content: string;
};

export type TChatGPTContext = Record<string, unknown>;

export enum GPTTask {
  JS_EXPRESSION = "js_expression",
  JS_FUNCTION = "js_function",
  SQL_QUERY = "sql_query",
}

export const GENERATE_JS_EXPRESSION = {
  id: GPTTask.JS_EXPRESSION,
  text: "JS expression",
  endpoint:
    "https://1rjnzog4zl.execute-api.ap-south-1.amazonaws.com/default/generate_js_expression_v2",
};

export const GENERATE_JS_FUNCTION = {
  id: GPTTask.JS_FUNCTION,
  text: "JS function",
  endpoint:
    "https://1rjnzog4zl.execute-api.ap-south-1.amazonaws.com/default/generate_js_function_v2",
};

export const GENERATE_SQL_QUERY = {
  id: GPTTask.SQL_QUERY,
  text: "SQL query",
  endpoint:
    "https://1rjnzog4zl.execute-api.ap-south-1.amazonaws.com/default/sql_query",
};

export const getGPTTasks = (pathname: string) => {
  const { pageType } = getEntityInCurrentPath(pathname);
  if (pageType === "canvas") {
    return [GENERATE_JS_EXPRESSION, GENERATE_JS_FUNCTION];
  } else if (pageType === "jsEditor") {
    return [GENERATE_JS_FUNCTION, GENERATE_JS_EXPRESSION];
  } else {
    return [GENERATE_SQL_QUERY, GENERATE_JS_EXPRESSION];
  }
};

export const base_context = [
  {
    role: "system",
    content: `Platform functions available are:
      - storeValue(key: string, value: any, persist? = true)
      - navigateTo(pageName: string, params?: {}, target: 'SAME_WINDOW' | 'NEW_WINDOW') -> Promise
      - download(url: string | blob, fileName: string, mimeType?: string)
      - setTimeout(callback: () => void, delay: number)
      - setInterval(callback: () => void, delay: number = 0, intervalId?: string)
      - clearInterval(intervalId: number)
      - clearTimeout(timeoutId: number)
      `,
  },
  {
    role: "system",
    content: `get_departments().then(() => showAlert("successfully executed", "success")).catch(e => navigateTo('www.google.com')). 
      get_departments represents an api/query and has run method in it that executes it. This expression executes get_departments and then navigates to google.com if the API fails. 
      If it succeeds, it shows a success alert with successfully executed message.`,
  },
  {
    role: "system",
    content:
      "You are a coding copilot that converts natural language instruction into Javascript code to perform the required task.",
  },
  {
    role: "system",
    content:
      "You only provide javascript code with no comments. No natural language text or explanation",
  },
  {
    role: "system",
    content:
      "If you are asked to store or save a key:value pair. console the function signature storeValue(key: string, value: any, persist? = true)",
  },
  {
    role: "system",
    content:
      "navigateTo allows the user to navigate between the internal pages of the App or to an external URL. function signature - navigateTo(pageName: string, params?: {}, target: 'SAME_WINDOW' | 'NEW_WINDOW') -> Promise",
  },
  {
    role: "system",
    content:
      "Displays a temporary toast-style alert message to the user, lasting 5 seconds. The duration of the alert message can't be modified. function signature - showAlert(message: string, style: string) -> Promise",
  },
  {
    role: "system",
    content:
      "Users have the ability to download a wide range of file formats. This action serves the purpose of downloading any data as a file. function signature - download(data: any, fileName: string, fileType?: string): Promise",
  },
  {
    role: "system",
    content: "context will be provided in the form of a JSON object",
  },
];

const getFunctionExpressionQuery = (query: string) =>
  `Generate a executable javascript expression to ${query}. Output code snippet only without comments or explanations. Do not use eval or new Function`;

const getFunctionQuery = (query: string) =>
  `Generate one executable javascript function to ${query} and give it a name. Wrap it inside {{ }}. If name is not mentioned in the query use myFn as the name. Output code snippet only without comments or explanations. Do not use eval or new Function`;

export const getMessageContent = (
  message: string,
  task: string,
  context: TChatGPTContext,
) => {
  const query =
    task === GPTTask.JS_EXPRESSION
      ? getFunctionExpressionQuery(message)
      : getFunctionQuery(message);
  return `Given the following context
    ${JSON.stringify(context, null, 2)}
    ${query}`;
};

function getPotentialEntityNamesFromMessage(
  message: string,
  entityNames: string[],
) {
  entityNames = entityNames.map((entityName) => entityName.toLowerCase());
  const words = message.split(" ");
  return words.filter((word) => entityNames.includes(word?.toLowerCase()));
}

export function useGPTContext(prompt: TChatGPTPrompt) {
  const dataTree = useSelector(getDataTree);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const contextGenerator = useSelector(getGPTContextGenerator);
  const prevQuery = usePrevious(prompt?.content);

  useEffect(() => {
    if (prompt?.role !== "user") return;
    if (prevQuery === prompt.content) return;
    const query = prompt.content;
    if (!query) return;
    const entityNames = Object.keys(dataTree);
    const entityNamesFromMessage = getPotentialEntityNamesFromMessage(
      query,
      entityNames,
    );
    const context = entityNamesFromMessage.reduce((acc, entityName) => {
      acc = { ...acc, ...contextGenerator(entityName) };
      return acc;
    }, {});
    setContext(context);
  }, [prompt]);

  return context;
}

function getActionData(data: any) {
  if (isArray(data)) {
    return data[0];
  } else {
    return data || {};
  }
}

const getGPTContextGenerator = createSelector(
  getDataTree,
  getWidgets,
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  (dataTree, widgets, actions, jsCollections) => {
    return (entityName: string) => {
      const entity = dataTree[entityName];
      if (isAction(entity)) {
        const action = actions.find((a) => a.config.name === entityName);
        return {
          [entityName]: {
            data: getActionData(action?.data?.body),
            run: "() => {}",
          },
        };
      } else if (isWidget(entity)) {
        const widget = find(
          Object.values(widgets),
          (widget) => widget.widgetName === entityName,
        );
        return {
          [entityName]: widget,
        };
      } else if (isJSAction(entity)) {
        const jsAction = jsCollections.find(
          (a) => a.config.name === entityName,
        );
        return {
          [entityName]: jsAction?.config.body.replace(/export default/g, ""),
        };
      }
    };
  },
);
