import React, { Context, createContext, ReactNode, useMemo } from "react";
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
  checkContainersForAutoHeightAction,
  updateWidgetAutoHeightAction,
} from "actions/autoHeightActions";
import {
  selectWidgetInitAction,
  WidgetSelectionRequest,
} from "actions/widgetSelectionActions";

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
  updateWidgetAutoHeight?: (widgetId: string, height: number) => void;
  checkContainersForAutoHeight?: () => void;
  selectWidgetRequest?: WidgetSelectionRequest;
};
export const EditorContext: Context<EditorContextType> = createContext({});

type EditorContextProviderProps = EditorContextType & {
  children: ReactNode;
};

function EditorContextProvider(props: EditorContextProviderProps) {
  const {
    batchUpdateWidgetProperty,
    checkContainersForAutoHeight,
    children,
    deleteWidgetProperty,
    disableDrag,
    executeAction,
    resetChildrenMetaProperty,
    selectWidgetRequest,
    syncUpdateWidgetMetaProperty,
    triggerEvalOnMetaUpdate,
    updateWidget,
    updateWidgetAutoHeight,
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
      updateWidgetAutoHeight,
      checkContainersForAutoHeight,
      selectWidgetRequest,
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
      updateWidgetAutoHeight,
      checkContainersForAutoHeight,
      selectWidgetRequest,
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
  updateWidgetAutoHeight: updateWidgetAutoHeightAction,
  checkContainersForAutoHeight: checkContainersForAutoHeightAction,
  selectWidgetRequest: selectWidgetInitAction,
};

export default connect(null, mapDispatchToProps)(EditorContextProvider);
