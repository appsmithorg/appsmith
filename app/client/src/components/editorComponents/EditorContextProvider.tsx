import React, {
  Context,
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { connect } from "react-redux";
import { get, set } from "lodash";

import { WidgetOperation } from "widgets/BaseWidget";

import { updateWidget } from "actions/pageActions";
import { executeTrigger, disableDragAction } from "actions/widgetActions";
import {
  updateWidgetPropertyRequest,
  deleteWidgetProperty as deletePropertyAction,
  batchUpdateWidgetProperty as batchUpdatePropertyAction,
  BatchPropertyUpdatePayload,
} from "actions/controlActions";

import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { OccupiedSpace } from "constants/CanvasEditorConstants";

import {
  resetChildrenMetaProperty,
  syncUpdateWidgetMetaProperty,
  triggerEvalOnMetaUpdate,
} from "actions/metaActions";
import {
  modifyMetaWidgets,
  deleteMetaWidgets,
  updateMetaWidgetProperty,
} from "actions/metaWidgetActions";
import {
  ModifyMetaWidgetPayload,
  DeleteMetaWidgetsPayload,
  UpdateMetaWidgetPropertyPayload,
} from "reducers/entityReducers/metaWidgetsReducer";
import { RenderMode, RenderModes } from "constants/WidgetConstants";

import {
  checkContainersForAutoHeightAction,
  updateWidgetAutoHeightAction,
} from "actions/autoHeightActions";

export type EditorContextType<TCache = unknown> = {
  executeAction?: (triggerPayload: ExecuteTriggerPayload) => void;
  updateWidget?: (
    operation: WidgetOperation,
    widgetId: string,
    payload: any,
  ) => void;
  triggerEvalOnMetaUpdate?: () => void;
  updateWidgetProperty?: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  resetChildrenMetaProperty?: (widgetId: string) => void;
  disableDrag?: (disable: boolean) => void;
  occupiedSpaces?: { [containerWidgetId: string]: OccupiedSpace[] };
  deleteWidgetProperty?: (widgetId: string, propertyPaths: string[]) => void;
  batchUpdateWidgetProperty?: (
    widgetId: string,
    updates: BatchPropertyUpdatePayload,
    shouldReplay: boolean,
  ) => void;
  syncUpdateWidgetMetaProperty?: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  updateWidgetAutoHeight?: (widgetId: string, height: number) => void;
  checkContainersForAutoHeight?: () => void;
  modifyMetaWidgets?: (modifications: ModifyMetaWidgetPayload) => void;
  setWidgetCache?: <TAltCache = void>(
    widgetId: string,
    data: TCache | TAltCache,
  ) => void;
  getWidgetCache?: <TAltCache = void>(
    widgetId: string,
  ) => TAltCache extends void ? TCache : TAltCache;
  deleteMetaWidgets?: (deletePayload: DeleteMetaWidgetsPayload) => void;
  updateMetaWidgetProperty?: (payload: UpdateMetaWidgetPropertyPayload) => void;
};
export const EditorContext: Context<EditorContextType> = createContext({});

type EditorContextProviderProps = EditorContextType & {
  children: ReactNode;
  renderMode: RenderMode;
};

type EditorContextTypeKey = keyof EditorContextType;

const COMMON_API_METHODS: EditorContextTypeKey[] = [
  "batchUpdateWidgetProperty",
  "executeAction",
  "getWidgetCache",
  "modifyMetaWidgets",
  "resetChildrenMetaProperty",
  "setWidgetCache",
  "updateMetaWidgetProperty",
  "syncUpdateWidgetMetaProperty",
  "triggerEvalOnMetaUpdate",
  "updateWidgetAutoHeight",
  "checkContainersForAutoHeight",
];

const PAGE_MODE_API_METHODS: EditorContextTypeKey[] = [...COMMON_API_METHODS];

const CANVAS_MODE_API_METHODS: EditorContextTypeKey[] = [
  ...COMMON_API_METHODS,
  "deleteMetaWidgets",
  "deleteWidgetProperty",
  "disableDrag",
  "updateWidget",
  "updateWidgetProperty",
];

const ApiMethodsListByRenderModes: Record<
  RenderMode,
  EditorContextTypeKey[]
> = {
  [RenderModes.CANVAS]: CANVAS_MODE_API_METHODS,
  [RenderModes.PAGE]: PAGE_MODE_API_METHODS,
  [RenderModes.CANVAS_SELECTED]: [],
  [RenderModes.COMPONENT_PANE]: [],
};

function extractFromObj<T, K extends keyof T>(
  obj: T,
  keys: K[],
): [Pick<T, K>, T[K][]] {
  const deps = [] as T[K][];
  const newObj = keys.reduce((newObj, curr) => {
    newObj[curr] = obj[curr];
    deps.push(obj[curr]);

    return newObj;
  }, {} as Pick<T, K>);

  return [newObj, deps];
}

function EditorContextProvider(props: EditorContextProviderProps) {
  const widgetCache = useRef<Record<string, unknown>>({});

  const setWidgetCache = useCallback((path: string, data: unknown) => {
    set(widgetCache.current, path, data);
  }, []);

  const getWidgetCache = useCallback(
    (path: string) => get(widgetCache.current, path),
    [],
  );

  const allMethods: EditorContextProviderProps = {
    ...props,
    setWidgetCache: setWidgetCache as EditorContextType["setWidgetCache"],
    getWidgetCache: getWidgetCache as EditorContextType["getWidgetCache"],
  };

  const { children, renderMode } = props;

  const apiMethodsList = ApiMethodsListByRenderModes[renderMode];
  const [apiMethods, apiMethodsDeps] = extractFromObj(
    allMethods,
    apiMethodsList,
  );

  // Memoize the context provider to prevent
  // unnecessary renders
  const contextValue = useMemo(() => apiMethods, apiMethodsDeps);
  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

const mapDispatchToProps = {
  updateWidgetProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => updateWidgetPropertyRequest(widgetId, propertyName, propertyValue),

  executeAction: executeTrigger,
  updateWidget,
  syncUpdateWidgetMetaProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => syncUpdateWidgetMetaProperty(widgetId, propertyName, propertyValue),
  resetChildrenMetaProperty,
  disableDrag: disableDragAction,
  deleteWidgetProperty: deletePropertyAction,
  batchUpdateWidgetProperty: batchUpdatePropertyAction,
  triggerEvalOnMetaUpdate: triggerEvalOnMetaUpdate,
  updateWidgetAutoHeight: updateWidgetAutoHeightAction,
  checkContainersForAutoHeight: checkContainersForAutoHeightAction,
  modifyMetaWidgets,
  updateMetaWidgetProperty,
  deleteMetaWidgets,
};

export default connect(null, mapDispatchToProps)(EditorContextProvider);
