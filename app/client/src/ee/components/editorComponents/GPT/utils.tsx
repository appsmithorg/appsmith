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
import {
  getCurrentActions,
  getCurrentJSCollections,
  getDatasourcesStructure,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import FuzzySet from "fuzzyset";
import WidgetFactory from "WidgetProvider/factory";
import log from "loglevel";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { WidgetType } from "constants/WidgetConstants";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";
import _, { get, isNull, isObject, uniq } from "lodash";
import { AutocompleteSorter } from "utils/autocomplete/AutocompleteSortRules";
import type { Completion } from "utils/autocomplete/CodemirrorTernService";
import type { WidgetProps } from "widgets/BaseWidget";
import { js_beautify } from "js-beautify";
import { apiRequestConfig } from "api/Api";
import axios from "axios";
import type { AxiosResponse, AxiosError } from "axios";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import type { AIEditorContext } from "@appsmith/components/editorComponents/GPT";
import type { ActionData } from "ce/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import type { Plugin } from "api/PluginApi";
import type {
  JSActionEntity,
  JSActionEntityConfig,
  DataTreeEntityObject,
} from "@appsmith/entities/DataTree/types";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { DatasourceStructure } from "entities/Datasource";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";

export interface TUserPrompt {
  role: "user";
  content: string;
  taskId: GPTTask;
}

export interface TAssistantPrompt {
  role: "assistant";
  content: {
    previewCode: string;
    editorCode: string;
  };
  messageId: string;
  liked?: boolean;
  taskId: GPTTask;
  query: string;
}

export interface TErrorPrompt {
  role: "error";
  content: string;
  taskId: GPTTask;
}

export interface TChatGenerationResponse {
  data: { response: string; messageId: string };
  errorDisplay: string;
  responseMeta: {
    status: number;
    success: true;
  };
}

export type TChatGPTPrompt = TAssistantPrompt | TUserPrompt | TErrorPrompt;

export type TChatGPTContext = Record<string, unknown>;

export enum GPTTask {
  JS_EXPRESSION = "JS_EXPR",
  SQL_QUERY = "SQL",
  JS_FUNCTION = "JS_FUNC",
}

export const GPT_JS_EXPRESSION = {
  id: GPTTask.JS_EXPRESSION,
  desc: "Generate Javascript expressions",
  inputPlaceholder: "I can generate JavaScript code, Ask me something.",
  buttonLabel: "Use this",
};

export const GPT_SQL_QUERY = {
  id: GPTTask.SQL_QUERY,
  desc: "Generate SQL query",
  inputPlaceholder: "I can generate SQL queries, Ask me something.",
  buttonLabel: "Use this",
};

export const GPT_JS_FUNCTION = {
  id: GPTTask.JS_FUNCTION,
  desc: "Generate JS functions",
  inputPlaceholder: "I can generate JS functions, Ask me something.",
  buttonLabel: "Insert Code",
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

export const chatGenerationApi = async ({
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
    }

    if (pageType === "jsEditor") {
      return GPT_JS_FUNCTION;
    }

    return GPT_JS_EXPRESSION;
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

const getStoreType = (dataTree: DataTree): { [key: string]: string } => {
  let store = {};

  if (
    dataTree?.appsmith &&
    "store" in dataTree.appsmith &&
    dataTree.appsmith.store
  ) {
    store = getTypeDef(dataTree.appsmith.store);
  }
  return store;
};

const getJSEditorContext = ({
  canvasWidgets,
  datasourcesStructure,
  dataTree,
  editorContext,
  pageActions,
  pageJSCollections,
  pluginList,
}: {
  canvasWidgets: CanvasWidgetsReduxState;
  editorContext: AIEditorContext;
  pageActions: ActionData[];
  pageJSCollections: JSCollectionData[];
  pluginList: Plugin[];
  dataTree: DataTree;
  datasourcesStructure: Record<string, DatasourceStructure>;
}): TChatGPTContext => {
  const { widgetTree, widgetTypes } = compressedWidgetData(canvasWidgets);
  const { cursorLineNumber, functionName, functionString } = editorContext;
  const store = getStoreType(dataTree);

  const datasourceActions = pageActions.map(
    ({
      config: {
        actionConfiguration,
        datasource,
        jsonPathKeys,
        name,
        pluginId,
        pluginType,
      },

      data,
    }) => {
      const dataType = getTypeDef(data?.body);
      return {
        name,
        pluginType,
        pluginSubType: pluginList.find((p) => p.id === pluginId)?.name,
        dataType: JSON.stringify(dataType),
        query: actionConfiguration?.body || "",
        variables: jsonPathKeys,
        actionConfiguration,
        datasource,
      };
    },
  );
  const jsObjects = pageJSCollections.map(
    ({ config: { actions: jsActions, name: jsObjectName, variables } }) => {
      return {
        name: jsObjectName,
        functions: jsActions.map(
          ({
            actionConfiguration: { body, jsArguments },
            jsonPathKeys,
            name: actionName,
          }) => ({
            name: actionName,
            body,
            arguments: jsArguments,
            variables: jsonPathKeys,
          }),
        ),
        variables: variables.map(({ name, value }) => {
          let type = "";
          try {
            const parsedValue = get(dataTree, `${jsObjectName}.${name}`, value);
            type = getTypeDef(parsedValue);
          } catch (e) {
            type = value;
          }

          return {
            name,
            value,
            dataType: JSON.stringify(type),
          };
        }),
      };
    },
  );

  return {
    widgetTypes,
    widgetTree,
    functionName,
    functionString,
    cursorLineNumber,
    datasourceActions,
    jsObjects,
    datasourcesStructure,
    store,
  };
};

const QUERY_SEPARATOR = ". ";

export function useGPTContextGenerator(
  dataTreePath?: string,
  triggerContext?: CodeEditorExpected,
) {
  const dataTree = useSelector(getDataTree);
  const contextGenerator = useSelector(getGPTContextGenerator);
  const location = useLocation();
  const pageActions = useSelector(getCurrentActions);
  const canvasWidgets = useSelector((state) => state.entities.canvasWidgets);
  const editorContext = useSelector((state) => state.ai.context);
  const pageJSCollections = useSelector(getCurrentJSCollections);
  const pluginList = useSelector(getPlugins);
  const datasourcesStructure = useSelector(getDatasourcesStructure);

  const generator = useMemo(
    () =>
      (prompt: TChatGPTPrompt): [TChatGPTContext, string, boolean] => {
        const defaultContext = [{}, "", true] as [
          TChatGPTContext,
          string,
          boolean,
        ];
        try {
          const { id, pageType } = getEntityInCurrentPath(location.pathname);

          if (prompt?.role !== "user") return defaultContext;
          if (!prompt.content) return defaultContext;

          if (pageType === "jsEditor") {
            const api_context = getJSEditorContext({
              canvasWidgets,
              editorContext,
              pageActions,
              pageJSCollections,
              pluginList,
              dataTree,
              datasourcesStructure,
            });

            return [{ api_context }, prompt.content, true];
          }

          let wrapWithBinding = true;
          const promptLines: string[] = [prompt.content];
          const entityNames = Object.keys(dataTree);
          const { exactMatches, partialMatches } =
            getPotentialEntityNamesFromMessage(prompt.content, entityNames);
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
          const meta: any = {};
          if (pageType === "queryEditor") {
            const query = pageActions.find((a) => a.config.id === id);
            const datasourceId = (query?.config?.datasource as any)?.id;
            meta["datasourceId"] = datasourceId;
          }
          if (
            triggerContext &&
            triggerContext.type &&
            triggerContext.type !== "Function"
          ) {
            promptLines.push(
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
              if (fieldSpecificPrompt) promptLines.push(fieldSpecificPrompt);
            }
          }
          return [
            {
              api_context,
              meta,
            },
            promptLines.join(QUERY_SEPARATOR),
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
      pageActions,
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

function isDataTreeEntityObject(
  entity: DataTreeEntity,
): entity is DataTreeEntityObject {
  return (entity as DataTreeEntityObject).ENTITY_TYPE !== undefined;
}

export const selectEntityNamesForGPT = createSelector(
  getDataTree,
  function (dataTree) {
    const entities: string[] = [];

    Object.keys(dataTree).forEach((k) => {
      const entity = dataTree[k];
      if (isDataTreeEntityObject(entity)) {
        if (entity.ENTITY_TYPE === ENTITY_TYPE_VALUE.JSACTION) {
          const functionNames = Object.keys(entity)
            .filter(
              (key) =>
                !["body", "ENTITY_TYPE", "actionId", "__evaluation__"].includes(
                  key,
                ),
            )
            .map((key) => `${k}.${key.split(".")[0]}`.toLowerCase());

          entities.push(...functionNames);
          return;
        }

        if (
          entity.ENTITY_TYPE === ENTITY_TYPE_VALUE.WIDGET &&
          entity.type === "CANVAS_WIDGET"
        ) {
          return;
        }

        entities.push(k.toLowerCase());
      }
    });

    return entities;
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

/**
 * Function that returns either all the jsFunctions from the jsObject or the JsVaribles
 */
function getJsObjectValues(
  evalTree: DataTree,
  configTree: ConfigTree,
  jsObjects: NavigationData[],
  isFunction = true,
) {
  const jsFunctions: NavigationData[] = [];
  const jsVariables: NavigationData[] = [];

  jsObjects.forEach((jsO: Record<string, any>) => {
    const evalObject = evalTree[jsO.name] as JSActionEntity;
    const configTreeObject = configTree[jsO.name] as JSActionEntityConfig;
    const jsVariablesKeys = configTreeObject.variables;
    const childrenKeys = Object.keys(jsO.children);

    childrenKeys.forEach((c) => {
      if (!jsVariablesKeys.includes(c)) {
        jsFunctions.push(jsO.children[c]);
      } else {
        const value = evalObject[c];
        const obj = _.cloneDeep(jsO.children[c]);
        obj.valueType = (typeof value).toUpperCase();
        jsVariables.push(obj);
      }
    });
  });

  if (isFunction) {
    return jsFunctions;
  }

  return jsVariables;
}

function getWidgetBindings(widgets: NavigationData[]) {
  const widgetBindings: Completion[] = [];

  widgets.forEach((widget) => {
    const widgetType = widget.widgetType;

    if (!widgetType) return;
    const autocompleteDefinitions =
      WidgetFactory.getAutocompleteDefinitions(widgetType) || {};
    let autocompleteDefinitionsObj: Record<string, any> = {};

    if (typeof autocompleteDefinitions === "function") {
      try {
        autocompleteDefinitionsObj = autocompleteDefinitions(
          widget as unknown as WidgetProps,
        );
      } catch (e) {
        log.debug(e);
        autocompleteDefinitionsObj = {};
      }
    } else {
      autocompleteDefinitionsObj = autocompleteDefinitions;
    }

    if (autocompleteDefinitionsObj) {
      /**
       * Using the Autocomplete config defined in widgets to pick the properties which can be shown as suggested bindings.
       * Therefore created this config as different set of types have been defined in the config that Tern server consumes
       * and we need to transform a different type to pass in the completions which we consume and use.
       */
      const typeConfig: Record<string, string> = {
        bool: "BOOLEAN",
        string: "STRING",
        JSON: "OBJECT",
        "[$__dropdownOption__$]": "ARRAY",
        "[$__dropdrowOptionWithChildren__$]": "ARRAY",
      };
      const autocompleteDefinitionsKeys: string[] = Object.keys(
        autocompleteDefinitionsObj,
      );

      autocompleteDefinitionsKeys.forEach((def: string) => {
        if (!def.startsWith("!")) {
          let type = autocompleteDefinitionsObj[def];

          if (isObject(autocompleteDefinitionsObj[def])) {
            type = autocompleteDefinitionsObj[def]["!type"];
          }

          let bindingType = typeConfig[type];

          if (type && type[0] === "[" && type[type.length - 1] === "]") {
            bindingType = "ARRAY";
          }

          widgetBindings.push({
            text: `${widget.name}.${def}`,
            origin: "DATA_TREE",
            type: bindingType,
            data: {
              ...widget,
              doc: "",
            },
          });
        }
      });
    }
  });

  return widgetBindings;
}

function transformSortedCompletions(
  sortedCompletions: Record<string, any>[],
  expectedType: string | undefined,
) {
  let randomIndex = 0;
  let prompts = [];
  let completions = [];

  /**
   * We want to show atleast 1 of each of the three functions, jsObject functions, platform function or queries. If
   * either query or jsObject is not present, we fill it up with variations of whichever is present and
   * in case none are present, we show only platform functions
   */
  if (expectedType === AutocompleteDataType.FUNCTION) {
    const platformFnCompletions: Record<string, any> = sortedCompletions.filter(
      (c) => c.origin === "DATA_TREE.APPSMITH.FUNCTIONS",
    );
    const actionsCompletions: Record<string, any> = sortedCompletions.filter(
      (c) => {
        return c.text.split(".").includes("run");
      },
    );
    const otherFunctions: Record<string, any> = sortedCompletions.filter(
      (c) =>
        c.type === "FUNCTION" &&
        c.origin !== "DATA_TREE.APPSMITH.FUNCTIONS" &&
        !c.text.split(".").includes("run"),
    );

    actionsCompletions.length
      ? completions.push(actionsCompletions.splice(0, 1)[0])
      : otherFunctions.length
      ? completions.push(otherFunctions.splice(0, 1)[0])
      : completions.push(platformFnCompletions.splice(0, 1)[0]);

    otherFunctions.length
      ? completions.push(otherFunctions.splice(0, 1)[0])
      : actionsCompletions.length
      ? completions.push(actionsCompletions.splice(0, 1)[0])
      : completions.push(platformFnCompletions.splice(0, 1)[0]);

    completions.push(platformFnCompletions.splice(0, 1)[0]);
  } else {
    completions = sortedCompletions;
  }

  return completions
    .filter((c: any) => !c.isHeader)
    .slice(0, 3)
    .map((c: Record<string, any>) => {
      switch (c.type) {
        case "ACTION":
          prompts = [
            `Bind data from ${c.text.split(".")[0]} to this property`,
            `Add first 5 values from ${c.text.split(".")[0]} to this property`,
          ];
          break;

        case "BOOLEAN":
        case "STRING":
        case "NUMBER":
          prompts = [
            `Bind ${c.text} to this property`,
            `Connect this property to ${c.text}`,
            `Use the value of ${c.text} in this property`,
          ];
          break;
        case "FUNCTION":
          prompts = [
            `Run ${c.text} on trigger of this property`,
            `Invoke ${c.text} upon this property's trigger`,
            `Call ${c.text} when this property is triggered`,
            `When this property triggers execute ${c.text} `,
          ];
          break;
        case "UNKNOWN":
        default:
          prompts = [`Bind ${c.text} to this property`];

          break;
      }
      randomIndex = Math.floor(Math.random() * prompts.length);
      c.text = c.prompt || prompts[randomIndex];

      return c;
    });
}

const platformFunctionsPrompts: Record<string, string> = {
  navigateTo: "Navigate to appsmith.com",
  showAlert: "Show an alert: 'Data saved successfully'",
  postWindowMessage: "Send message to iframe: 'Hello from Appsmith'",
  copyToClipboard: "Copy user email to clipboard",
  storeValue: "Store value of user email",
  clearStore: "Clear all stored values",
  windowMessageListener: "Listen for messages from 'https://appsmith.com'",
  unlistenWindowMessage:
    "Stop listening for messages from 'https://example.com'",
};

export function getAllPossibleBindingsForSuggestions(
  entity: FieldEntityInformation,
  entitiesForNavigation: EntityNavigationData,
  platformFunctions: Record<string, unknown>[],
  evalTree: DataTree,
  configTree: ConfigTree,
  dataTreePath: string | undefined,
) {
  const expectedType = entity.expectedType;
  const listOfBindings: Record<string, any>[] = [];
  const entitiesForNavigationValues = Object.values(entitiesForNavigation);
  let sortedCompletions: Record<string, any>[] = [];
  const jsObjects: NavigationData[] = entitiesForNavigationValues.filter(
    (e) => e.type === "JSACTION",
  );
  const actions = entitiesForNavigationValues.filter(
    (e) => e.type === "ACTION",
  );

  // These are a whitelist of properties for which we need to show only suggestions with actions as bindings or show nothing.
  let addOnlyActions = false;
  const onlyActionsForProperties: Record<string, string[]> = {
    TEXT_WIDGET: ["text"],
    TABLE_WIDGET_V2: ["tableData"],
    JSON_FORM_WIDGET: ["sourceData"],
    INPUT_WIDGET_V2: ["defaultText", "validation"],
    SELECT_WIDGET: ["sourceData"],
    BUTTON_WIDGET: ["onClick"],
  };

  /**
   * We build the list of completions from the entites that are available on
   *  appsmith like platform functions, widgets, actions, datasources etc.
   *  */
  switch (expectedType) {
    case AutocompleteDataType.FUNCTION:
      //Add all the platform functions
      const platformFunctionsToUse: Record<string, any> = [];
      platformFunctions.forEach((pf: Record<string, any>) => {
        const name = pf.name as string;

        if (platformFunctionsPrompts[name]) {
          platformFunctionsToUse.push({
            ...pf,
            prompt: platformFunctionsPrompts[name],
          });
        }
      });

      listOfBindings.push(
        ...platformFunctionsToUse.map((f: Record<string, any>) => {
          return { ...f, origin: "DATA_TREE.APPSMITH.FUNCTIONS" };
        }),
      );

      //Adding all the jsObject functions
      const jsObjectFunctions = getJsObjectValues(
        evalTree,
        configTree,
        jsObjects,
        true,
      );
      listOfBindings.push(...jsObjectFunctions);

      //Adding the run function for the actions like 'api1.run'
      listOfBindings.push(
        ..._.flatten(
          actions.map((a) => {
            return [{ ...a, name: `${a.name}.run` }];
          }),
        ),
      );

      /**
       * Transform the structure into the completions format so we can pass
       * it through the sort function to get the best match results like we do in autocomplete.
       *  */
      const completions: Completion[] = listOfBindings.map((b: any) => {
        return {
          origin: b.origin || "DATA_TREE",
          data: {
            ...b,
            origin: "DATA_TREE",
            type: "fn(params: ?)",
          },
          text: b.name,
          type: "FUNCTION",
          prompt: b.prompt,
        };
      });
      sortedCompletions = AutocompleteSorter.sort(completions, entity);

      break;
    default:
      //Adding all the data properties for the datasources like 'Api1.data'
      listOfBindings.push(
        ..._.flatten(
          actions.map((a) => {
            return [{ ...a, name: `${a.name}.data` }];
          }),
        ),
      );

      const widgetType = entity.widgetType;

      if (dataTreePath && widgetType) {
        const { propertyPath } = getEntityNameAndPropertyPath(dataTreePath);

        if (onlyActionsForProperties[widgetType]?.includes(propertyPath)) {
          addOnlyActions = true;
        }
      }

      /**
       * Add widgets in case of the properties where we show even possible bindings with other widget properties
       */
      if (!addOnlyActions) {
        const widgets: NavigationData[] = entitiesForNavigationValues.filter(
          (e) => e.type === "WIDGET",
        );
        const widgetBindings: Completion[] = getWidgetBindings(widgets);
        listOfBindings.push(...widgetBindings);

        //Adding js variables
        const jsObjectVariables = getJsObjectValues(
          evalTree,
          configTree,
          jsObjects,
          false,
        );
        listOfBindings.push(...jsObjectVariables);
      }

      const completion = listOfBindings.map((b: any) => {
        return {
          origin: "DATA_TREE",
          data: {
            ...b,
            origin: "DATA_TREE",
            type: "?",
          },
          text: b.name || b.text,
          type: b.valueType || b.type || "UNKNOWN",
        };
      });

      const sameTypedCompletions = completion.filter(
        (c) => c.type === expectedType,
      );

      sortedCompletions = AutocompleteSorter.sort(
        sameTypedCompletions.length > 2 ? sameTypedCompletions : completion,
        entity,
      );
  }

  const transformedBindings = transformSortedCompletions(
    sortedCompletions,
    expectedType,
  );

  return transformedBindings;
}
function replaceWidgetSuffix(input: string): string {
  const replacements: { [key: string]: string } = {
    _WIDGET: "", // Replace with whatever you want
    _WIDGET2: "", // Replace with whatever you want
    WIDGET_V2: "", // Replace with whatever you want
  };

  for (const key in replacements) {
    if (input.endsWith(key)) {
      const value = replacements[key];
      return input.substring(0, input.length - key.length) + value;
    }
  }

  return input;
}
export function compressedWidgetData(widgets: CanvasWidgetsReduxState) {
  const widgetTypes: string[] = [];

  function processWidgets(parentId: string, widgets: CanvasWidgetsReduxState) {
    const children: [string, string, any[]?][] = [];

    Object.values(widgets).forEach((widget: FlattenedWidgetProps) => {
      if (widget.parentId === parentId) {
        if (widget.type !== "CANVAS_WIDGET") {
          const widgetType = replaceWidgetSuffix(widget.type);
          const currentChildren: [string, string, any[]?] = [
            widget.widgetName,
            widgetType,
          ];

          widgetTypes.push(widgetType);

          if (widget.children) {
            currentChildren.push(processWidgets(widget.widgetId, widgets));
          }
          children.push(currentChildren);
        } else if (widget.children) {
          children.push(...processWidgets(widget.widgetId, widgets));
        }
      }
    });

    return children;
  }

  return {
    widgetTree: processWidgets("0", widgets),
    widgetTypes: uniq(widgetTypes),
  };
}

const getTypeDef = (obj: any): any => {
  if (typeof obj !== "object" || isNull(obj)) {
    return typeof obj;
  }

  if (Array.isArray(obj)) {
    return [getTypeDef(obj[0])];
  }

  const typeDef: Record<string, any> = {};

  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      typeDef[key] = [getTypeDef(obj[key][0])];
    } else {
      typeDef[key] = getTypeDef(obj[key]);
    }
  }

  return typeDef;
};
