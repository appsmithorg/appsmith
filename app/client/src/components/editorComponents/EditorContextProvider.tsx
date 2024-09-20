import type { Context, ReactNode } from "react";
import React, { createContext, useCallback, useMemo, useRef } from "react";
import { connect } from "react-redux";
import { get, set } from "lodash";

import type { WidgetOperation } from "widgets/BaseWidget";

import { updateWidget } from "actions/pageActions";
import {
  executeTrigger,
  disableDragAction,
  focusWidget,
} from "actions/widgetActions";
import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import {
  updateWidgetPropertyRequest,
  deleteWidgetProperty as deletePropertyAction,
  batchUpdateWidgetProperty as batchUpdatePropertyAction,
} from "actions/controlActions";

import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import type { OccupiedSpace } from "constants/CanvasEditorConstants";

import type { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";
import {
  resetChildrenMetaProperty,
  syncBatchUpdateWidgetMetaProperties,
  syncUpdateWidgetMetaProperty,
  triggerEvalOnMetaUpdate,
} from "actions/metaActions";
import {
  modifyMetaWidgets,
  deleteMetaWidgets,
  updateMetaWidgetProperty,
} from "actions/metaWidgetActions";
import type {
  ModifyMetaWidgetPayload,
  DeleteMetaWidgetsPayload,
  UpdateMetaWidgetPropertyPayload,
} from "reducers/entityReducers/metaWidgetsReducer";
import type { RenderMode } from "constants/WidgetConstants";
import { RenderModes } from "constants/WidgetConstants";

import {
  checkContainersForAutoHeightAction,
  updateWidgetAutoHeightAction,
} from "actions/autoHeightActions";
import type { WidgetSelectionRequest } from "actions/widgetSelectionActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import {
  updatePositionsOnTabChange,
  updateWidgetDimensionAction,
} from "actions/autoLayoutActions";
import { updateOneClickBindingOptionsVisibility } from "actions/oneClickBindingActions";

export interface EditorContextType<TCache = unknown> {
  executeAction?: (triggerPayload: ExecuteTriggerPayload) => void;
  updateWidget?: (
    operation: WidgetOperation,
    widgetId: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
  ) => void;
  triggerEvalOnMetaUpdate?: () => void;
  updateWidgetProperty?: (
    widgetId: string,
    propertyName: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyValue: any,
  ) => void;
  syncBatchUpdateWidgetMetaProperties?: (
    batchMetaUpdates: UpdateWidgetMetaPropertyPayload[],
  ) => void;
  updateWidgetAutoHeight?: (widgetId: string, height: number) => void;
  updateWidgetDimension?: (
    widgetId: string,
    width: number,
    height: number,
  ) => void;
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
  selectWidgetRequest?: WidgetSelectionRequest;
  updatePositionsOnTabChange?: (widgetId: string, selectedTab: string) => void;
  updateOneClickBindingOptionsVisibility?: (visibility: boolean) => void;
  unfocusWidget?: () => void;
}
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
  "deleteMetaWidgets",
  "resetChildrenMetaProperty",
  "setWidgetCache",
  "updateMetaWidgetProperty",
  "syncUpdateWidgetMetaProperty",
  "syncBatchUpdateWidgetMetaProperties",
  "triggerEvalOnMetaUpdate",
  "updateWidgetAutoHeight",
  "updateWidgetDimension",
  "checkContainersForAutoHeight",
  "selectWidgetRequest",
  "updatePositionsOnTabChange",
  "unfocusWidget",
];

const PAGE_MODE_API_METHODS: EditorContextTypeKey[] = [...COMMON_API_METHODS];

const CANVAS_MODE_API_METHODS: EditorContextTypeKey[] = [
  ...COMMON_API_METHODS,
  "deleteWidgetProperty",
  "disableDrag",
  "updateWidget",
  "updateWidgetProperty",
  "updateOneClickBindingOptionsVisibility",
];

const ApiMethodsListByRenderModes: Record<RenderMode, EditorContextTypeKey[]> =
  {
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
  const newObj = keys.reduce(
    (newObj, curr) => {
      newObj[curr] = obj[curr];
      deps.push(obj[curr]);

      return newObj;
    },
    {} as Pick<T, K>,
  );

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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyValue: any,
  ) => updateWidgetPropertyRequest(widgetId, propertyName, propertyValue),

  executeAction: executeTrigger,
  updateWidget,
  syncUpdateWidgetMetaProperty: (
    widgetId: string,
    propertyName: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyValue: any,
  ) => syncUpdateWidgetMetaProperty(widgetId, propertyName, propertyValue),
  syncBatchUpdateWidgetMetaProperties: (
    batchMetaUpdates: UpdateWidgetMetaPropertyPayload[],
  ) => syncBatchUpdateWidgetMetaProperties(batchMetaUpdates),
  resetChildrenMetaProperty,
  disableDrag: disableDragAction,
  deleteWidgetProperty: deletePropertyAction,
  batchUpdateWidgetProperty: batchUpdatePropertyAction,
  triggerEvalOnMetaUpdate: triggerEvalOnMetaUpdate,
  updateWidgetAutoHeight: updateWidgetAutoHeightAction,
  updateWidgetDimension: updateWidgetDimensionAction,
  checkContainersForAutoHeight: checkContainersForAutoHeightAction,
  modifyMetaWidgets,
  updateMetaWidgetProperty,
  deleteMetaWidgets,
  selectWidgetRequest: selectWidgetInitAction,
  updatePositionsOnTabChange: updatePositionsOnTabChange,
  updateOneClickBindingOptionsVisibility:
    updateOneClickBindingOptionsVisibility,
  unfocusWidget: focusWidget,
};

export default connect(null, mapDispatchToProps)(EditorContextProvider);
