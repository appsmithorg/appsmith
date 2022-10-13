import React, {
  Context,
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { connect } from "react-redux";

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
} from "actions/metaWidgetActions";
import {
  ModifyMetaWidgetPayload,
  DeleteMetaWidgetsPayload,
} from "reducers/entityReducers/metaCanvasWidgetsReducer";

export type EditorContextType = {
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
  modifyMetaWidgets?: (modifications: ModifyMetaWidgetPayload) => void;
  // TODO (ashit) - Use generics instead of unknown
  setWidgetCache?: (widgetId: string, data: unknown) => void;
  getWidgetCache?: (widgetId: string) => unknown;
  deleteMetaWidgets?: (creatorId: DeleteMetaWidgetsPayload) => void;
};
export const EditorContext: Context<EditorContextType> = createContext({});

type EditorContextProviderProps = EditorContextType & {
  children: ReactNode;
};

function EditorContextProvider(props: EditorContextProviderProps) {
  const widgetCache = useRef<Record<string, unknown>>({});

  // TODO: (Ashit) - Use generics for data.
  const setWidgetCache = useCallback((widgetId: string, data: unknown) => {
    widgetCache.current[widgetId] = data;
  }, []);

  const getWidgetCache = useCallback(
    (widgetId: string) => widgetCache.current[widgetId],
    [],
  );

  const {
    batchUpdateWidgetProperty,
    children,
    deleteMetaWidgets,
    deleteWidgetProperty,
    disableDrag,
    executeAction,
    modifyMetaWidgets,
    resetChildrenMetaProperty,
    syncUpdateWidgetMetaProperty,
    triggerEvalOnMetaUpdate,
    updateWidget,
    updateWidgetProperty,
  } = props;

  // Memoize the context provider to prevent
  // unnecessary renders
  const contextValue = useMemo(
    () => ({
      executeAction,
      updateWidget,
      updateWidgetProperty,
      syncUpdateWidgetMetaProperty,
      disableDrag,
      resetChildrenMetaProperty,
      deleteWidgetProperty,
      batchUpdateWidgetProperty,
      triggerEvalOnMetaUpdate,
      modifyMetaWidgets,
      setWidgetCache,
      getWidgetCache,
      deleteMetaWidgets,
    }),
    [
      executeAction,
      updateWidget,
      updateWidgetProperty,
      syncUpdateWidgetMetaProperty,
      disableDrag,
      resetChildrenMetaProperty,
      deleteWidgetProperty,
      batchUpdateWidgetProperty,
      triggerEvalOnMetaUpdate,
      modifyMetaWidgets,
      setWidgetCache,
      getWidgetCache,
      deleteMetaWidgets,
    ],
  );
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
  modifyMetaWidgets,
  deleteMetaWidgets,
};

export default connect(null, mapDispatchToProps)(EditorContextProvider);
