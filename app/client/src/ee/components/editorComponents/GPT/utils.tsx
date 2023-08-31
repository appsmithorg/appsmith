import type { AppState } from "@appsmith/reducers";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isTrueObject,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import { createSelector } from "reselect";
import { getEntityInCurrentPath } from "sagas/RecentEntitiesSagas";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getActionsForCurrentPage } from "selectors/entitiesSelector";
import FuzzySet from "fuzzyset";
import WidgetFactory from "utils/WidgetFactory";
import log from "loglevel";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { WidgetType } from "constants/WidgetConstants";
import { js_beautify } from "js-beautify";
import { apiRequestConfig } from "api/Api";
import axios from "axios";
import type { AxiosResponse, AxiosError } from "axios";

export type TUserPrompt = {
  role: "user";
  content: string;
  taskId: GPTTask;
};

export type TAssistantPrompt = {
  role: "assistant";
  content: {
    previewCode: string;
    editorCode: string;
  };
  messageId: string;
  liked?: boolean;
  taskId: GPTTask;
  query: string;
};

export type TErrorPrompt = {
  role: "error";
  content: string;
  taskId: GPTTask;
};

export type TChatGenerationResponse = {
  data: { response: string; messageId: string };
  errorDisplay: string;
  responseMeta: {
    status: number;
    success: true;
  };
};

export type TChatGPTPrompt = TAssistantPrompt | TUserPrompt | TErrorPrompt;

export type TChatGPTContext = Record<string, unknown>;

export enum GPTTask {
  JS_EXPRESSION = "JS_EXPR",
  SQL_QUERY = "SQL",
  REFACTOR_CODE = "REFACTOR_CODE",
}

export const GPT_JS_EXPRESSION = {
  id: GPTTask.JS_EXPRESSION,
  desc: "Generate Javascript expressions",
  inputPlaceholder: "I can generate JavaScript code, Ask me something.",
};

export const GPT_SQL_QUERY = {
  id: GPTTask.SQL_QUERY,
  desc: "Generate SQL query",
  inputPlaceholder: "I can generate SQL queries, Ask me something.",
};

export const getErrorMessage = (
  error: AxiosError<{
    responseMeta: {
      status: 500;
      success: boolean;
      error: {
        code: "AE-APP-5013";
        title: "EE_FEATURE_ERROR";
        message: string;
        errorType: string;
      };
    };
    errorDisplay: string;
  }>,
) => {
  if (error?.code === "ECONNABORTED") {
    return "Connection timed out, its taking too long to generate code for you. Can you try again.";
  }

  if (
    error.response?.data?.responseMeta?.error?.message?.includes(
      "Too many requests",
    )
  ) {
    return "Too many requests. You have already used 50 requests today. Please try again tomorrow or contact Appsmith team.";
  }

  return "We can not generate a response for this prompt, to get accurate responses we need prompts to be more specific.";
};

export const chatGenerationApi = ({
  context,
  query,
  taskId,
}: {
  context: TChatGPTContext;
  query: string;
  taskId: GPTTask;
}) => {
  return axios.post<
    TChatGPTContext & { user_query: string },
    AxiosResponse<TChatGenerationResponse>
  >(
    `/v1/chat/chat-generation?type=${taskId}`,
    {
      user_query: query,
      ...context,
    },
    apiRequestConfig,
  );
};

export const useGPTTask = () => {
  const location = useLocation();
  const { pageType } = getEntityInCurrentPath(location.pathname);
  return useMemo(() => {
    if (pageType === "queryEditor") {
      return GPT_SQL_QUERY;
    } else {
      return GPT_JS_EXPRESSION;
    }
  }, [location.pathname]);
};

const JS_BEAUTIFY_OPTIONS: js_beautify.JSBeautifyOptions = {
  indent_size: 2,
  indent_char: " ",
  max_preserve_newlines: 2,
  preserve_newlines: true,
  keep_array_indentation: false,
  break_chained_methods: true,
  brace_style: "collapse",
  space_before_conditional: true,
  unescape_strings: false,
  jslint_happy: true,
  end_with_newline: false,
  wrap_line_length: 28,
  comma_first: false,
  e4x: false,
  indent_empty_lines: false,
};
const PREVIEW_MAX_LENGTH = 50;
const EDITOR_MAX_LENGTH = 28;

export const getFormattedCode = (
  code: string,
  taskId: GPTTask,
  wrapWithBinding = false,
) => {
  const formattedCode = {
    previewCode: code,
    editorCode: code,
  };

  if (taskId === GPTTask.JS_EXPRESSION) {
    const previewCode = js_beautify(code, {
      ...JS_BEAUTIFY_OPTIONS,
      wrap_line_length: PREVIEW_MAX_LENGTH,
    });

    const editorCode = js_beautify(code, {
      ...JS_BEAUTIFY_OPTIONS,
      wrap_line_length: EDITOR_MAX_LENGTH,
    });

    if (wrapWithBinding) {
      const isMultiLinePreview = previewCode.split("\n").length > 1;
      const isMultiLineEditor = editorCode.split("\n").length > 1;

      formattedCode.previewCode = isMultiLinePreview
        ? `{{\n${previewCode}\n}}`
        : `{{${previewCode}}}`;
      formattedCode.editorCode = isMultiLineEditor
        ? `{{\n${editorCode}\n}}`
        : `{{${editorCode}}}`;
    }
  }

  return formattedCode;
};

/**
 * Looks at the words in user query and tries to fuzzy match it with an existing application entity
 * @param message
 * @param entityNames
 * @returns
 */
function getPotentialEntityNamesFromMessage(
  message: string,
  entityNames: string[],
) {
  const words = message
    .split(" ")
    .filter(Boolean)
    .map((word) => word?.toLowerCase());
  const smallestEntityNameLength = Math.min(
    ...entityNames.map((e) => e.length),
  );
  const set = FuzzySet(
    entityNames,
    true,
    smallestEntityNameLength,
    smallestEntityNameLength + 1,
  );
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
      //Selects only paths that can be autocompleted
      let autocompleteDefinitions =
        WidgetFactory.getAutocompleteDefinitions(entity.type) || {};
      if (typeof autocompleteDefinitions === "function") {
        try {
          autocompleteDefinitions = autocompleteDefinitions(entity);
        } catch (e) {
          log.debug(e);
          autocompleteDefinitions = {};
        }
      }
      const minimumEntityInfo: Record<string, unknown> = {};
      const entityFields = Object.keys(entity);
      for (const field of entityFields) {
        if (autocompleteDefinitions.hasOwnProperty(field))
          minimumEntityInfo[field] = entity[field];
      }
      const widgetSkeleton = getDataSkeleton(minimumEntityInfo);
      context[entityName] = {
        ...widgetSkeleton,
        type: "WIDGET",
        widgetType: entity.type,
      };
    } else if (isJSAction(entity)) {
      context[entityName] = {
        body: entity.body.replace(/export default/g, ""),
        type: "JS_ACTION",
      };
    }
    return context;
  };
});

const FIELD_SPECIFIC_PROMPTS: Record<WidgetType, Record<string, string>> = {
  SELECT_WIDGET: {
    options: `"value" must be unique`,
  },
  MULTI_SELECT_WIDGET: {
    options: `"value" must be unique`,
  },
  MULTI_SELECT_WIDGET_V2: {
    options: `"value" must be unique`,
  },
  MULTI_SELECT_TREE_WIDGET: {
    options: `"value" must be unique`,
  },
};

const QUERY_SEPARATOR = ". ";

export function useGPTContextGenerator(
  dataTreePath?: string,
  triggerContext?: CodeEditorExpected,
) {
  const dataTree = useSelector(getDataTree);
  const contextGenerator = useSelector(getGPTContextGenerator);
  const location = useLocation();
  const actions = useSelector(getActionsForCurrentPage);
  const generator = useMemo(
    () =>
      (prompt: TChatGPTPrompt): [TChatGPTContext, string, boolean] => {
        const defaultContext = [{}, "", true] as [
          TChatGPTContext,
          string,
          boolean,
        ];
        try {
          let wrapWithBinding = true;
          const additionalQueries: string[] = [];
          if (prompt?.role !== "user") return defaultContext;
          const query = prompt.content;
          if (!query) return defaultContext;
          const entityNames = Object.keys(dataTree);
          const { exactMatches, partialMatches } =
            getPotentialEntityNamesFromMessage(query, entityNames);
          //Ignore partial matches if exact match exists
          const entityNamesFromMessage = exactMatches.length
            ? exactMatches
            : partialMatches.slice(0, 2);
          const api_context = entityNamesFromMessage.reduce(
            (acc, entityName) => {
              acc = { ...acc, ...contextGenerator(entityName) };
              return acc;
            },
            {} as any,
          );
          const { id, pageType } = getEntityInCurrentPath(location.pathname);
          const meta: any = {};
          if (pageType === "queryEditor") {
            const query = actions.find((a) => a.config.id === id);
            const datasourceId = (query?.config?.datasource as any)?.id;
            meta["datasourceId"] = datasourceId;
          }
          if (
            triggerContext &&
            triggerContext.type &&
            triggerContext.type !== "Function"
          ) {
            additionalQueries.push(
              `Return type of the expression should be of type '${triggerContext.type}'`,
            );
            if (triggerContext.type === "regExp") {
              wrapWithBinding = false;
            }
          }
          if (dataTreePath) {
            const { entityName, propertyPath } =
              getEntityNameAndPropertyPath(dataTreePath);
            const entity = dataTree[entityName];
            if (isWidget(entity)) {
              const type = entity.type;
              const fieldSpecificPrompt =
                FIELD_SPECIFIC_PROMPTS[type]?.[propertyPath] || "";
              if (fieldSpecificPrompt)
                additionalQueries.push(fieldSpecificPrompt);
            }
          }
          return [
            {
              api_context,
              meta,
            },
            additionalQueries.join(QUERY_SEPARATOR),
            wrapWithBinding,
          ];
        } catch (e) {
          return defaultContext;
        }
      },
    [
      dataTree,
      contextGenerator,
      location.pathname,
      actions,
      dataTreePath,
      triggerContext,
    ],
  );
  return generator;
}

/**
 * Takes a value and recursive replaces it with `typeof value`
 * @param data
 * @returns
 */
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

export const selectIsAILoading = (state: AppState) => state.ai.isLoading;

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

export function selectGPTTriggerContext(state: AppState) {
  return state.ai.context;
}

export const selectEntityNamesForGPT = createSelector(
  getDataTree,
  function (dataTree) {
    return Object.keys(dataTree).map((k) => k?.toLowerCase());
  },
);

export function useTextAutocomplete(
  query: string,
  acceptSuggestion: (suggestion: string) => void,
) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const overLayRef = useRef<HTMLDivElement | null>(null);
  const searchSpace = useSelector(selectEntityNamesForGPT);
  const [matches, setMatches] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);

  const cycleThroughMatches = useCallback(
    (next: boolean) => {
      const totalMatchesCount = matches.length;
      if (totalMatchesCount === 0) return;
      if (next) {
        setCurrentMatchIndex(
          (currentMatchIndex) =>
            (currentMatchIndex + 1 + totalMatchesCount) % totalMatchesCount,
        );
      } else {
        setCurrentMatchIndex(
          (currentMatchIndex) =>
            (currentMatchIndex - 1 + totalMatchesCount) % totalMatchesCount,
        );
      }
    },
    [matches, currentMatchIndex],
  );

  useEffect(() => {
    if (!ref.current) return;
    const keysListener = (e: KeyboardEvent) => {
      if (!overLayRef.current?.innerText) return;
      if (e.key === "ArrowUp") {
        cycleThroughMatches(false);
      } else if (e.key === "ArrowDown") {
        cycleThroughMatches(true);
      } else if (e.key === "Tab") {
        if (!overLayRef.current?.innerText) return;
        acceptSuggestion(overLayRef.current?.innerText);
        setCurrentMatchIndex(-1);
        setMatches([]);
      } else {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
    };
    ref.current.addEventListener("keydown", keysListener);

    return () => ref.current?.removeEventListener("keydown", keysListener);
  }, [cycleThroughMatches, acceptSuggestion]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (overLayRef.current) {
      overLayRef.current.innerText = "";
    }
    const text = ref.current.textContent;
    if (!text) return;
    const lines = text.split("\n");
    const lastLine = lines[lines.length - 1];
    const words = lastLine.split(" ");
    if (!words.length) return;
    const lastWord = words[words.length - 1];
    const lastWordLength = lastWord.length;
    const currentMatch = matches[currentMatchIndex];
    if (!currentMatch) return;
    const difference = `${currentMatch.slice(lastWordLength)}`;
    if (overLayRef.current)
      overLayRef.current.innerText = ref.current.textContent + difference;
  }, [currentMatchIndex, matches]);

  useLayoutEffect(() => {
    if (ref.current) {
      const overlay = document.createElement("div");
      overlay.id = "autocomplete-overlay";
      overlay.classList.add("autocomplete-overlay");
      overLayRef.current = overlay;
      const parent = ref.current.parentElement;
      if (parent) {
        parent.appendChild(overlay);
      }
    }
  }, []);
  useEffect(() => {
    if (overLayRef.current) {
      overLayRef.current.innerText = "";
    }
    if (ref.current) {
      const text = ref.current.textContent;
      if (!text) return;
      const lines = text.split("\n");
      const lastLine = lines[lines.length - 1];
      const words = lastLine.split(" ");
      if (!words.length) return;
      const lastWord = words[words.length - 1];
      if (!lastWord) return;
      if (lastWord.length < 2) return;
      const matches = searchSpace.filter((s) =>
        s.startsWith(lastWord.toLowerCase()),
      );
      if (!matches) return;
      setMatches(matches);
      setCurrentMatchIndex(0);
    }
  }, [query]);
  return ref;
}
