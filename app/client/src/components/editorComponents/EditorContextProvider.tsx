import React, { Context, createContext, ReactNode, useMemo } from "react";
import { connect } from "react-redux";

import { WidgetOperation } from "widgets/BaseWidget";

import { updateWidget } from "actions/pageActions";
import { executeAction, disableDragAction } from "actions/widgetActions";
import {
  updateWidgetPropertyRequest,
  deleteWidgetProperty as deletePropertyAction,
  batchUpdateWidgetProperty as batchUpdatePropertyAction,
  BatchPropertyUpdatePayload,
} from "actions/controlActions";

import { ExecuteActionPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderModes } from "constants/WidgetConstants";
import { OccupiedSpace } from "constants/editorConstants";

import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "actions/metaActions";

export type EditorContextType = {
  executeAction?: (actionPayloads: ExecuteActionPayload) => void;
  updateWidget?: (
    operation: WidgetOperation,
    widgetId: string,
    payload: any,
  ) => void;
  updateWidgetProperty?: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  updateWidgetMetaProperty?: (
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
  ) => void;
};
export const EditorContext: Context<EditorContextType> = createContext({});

type EditorContextProviderProps = EditorContextType & {
  children: ReactNode;
};

function EditorContextProvider(props: EditorContextProviderProps) {
  const {
    batchUpdateWidgetProperty,
    children,
    deleteWidgetProperty,
    disableDrag,
    executeAction,
    resetChildrenMetaProperty,
    updateWidget,
    updateWidgetMetaProperty,
    updateWidgetProperty,
  } = props;

  // Memoize the context provider to prevent
  // unnecessary renders
  const contextValue = useMemo(
    () => ({
      executeAction,
      updateWidget,
      updateWidgetProperty,
      updateWidgetMetaProperty,
      disableDrag,
      resetChildrenMetaProperty,
      deleteWidgetProperty,
      batchUpdateWidgetProperty,
    }),
    [
      executeAction,
      updateWidget,
      updateWidgetProperty,
      updateWidgetMetaProperty,
      disableDrag,
      resetChildrenMetaProperty,
      deleteWidgetProperty,
      batchUpdateWidgetProperty,
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
  ) =>
    updateWidgetPropertyRequest(
      widgetId,
      propertyName,
      propertyValue,
      RenderModes.CANVAS,
    ),

  executeAction,
  updateWidget,
  updateWidgetMetaProperty,
  resetChildrenMetaProperty,
  disableDrag: disableDragAction,
  deleteWidgetProperty: deletePropertyAction,
  batchUpdateWidgetProperty: batchUpdatePropertyAction,
};

export default connect(null, mapDispatchToProps)(EditorContextProvider);
