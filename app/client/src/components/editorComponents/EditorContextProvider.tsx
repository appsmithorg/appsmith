import React, { Context, createContext, ReactNode } from "react";
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

const EditorContextProvider = (props: EditorContextProviderProps) => {
  const {
    executeAction,
    updateWidget,
    updateWidgetProperty,
    updateWidgetMetaProperty,
    disableDrag,
    children,
    resetChildrenMetaProperty,
    deleteWidgetProperty,
    batchUpdateWidgetProperty,
  } = props;
  return (
    <EditorContext.Provider
      value={{
        executeAction,
        updateWidget,
        updateWidgetProperty,
        updateWidgetMetaProperty,
        disableDrag,
        resetChildrenMetaProperty,
        deleteWidgetProperty,
        batchUpdateWidgetProperty,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    updateWidgetProperty: (
      widgetId: string,
      propertyName: string,
      propertyValue: any,
    ) =>
      dispatch(
        updateWidgetPropertyRequest(
          widgetId,
          propertyName,
          propertyValue,
          RenderModes.CANVAS,
        ),
      ),
    executeAction: (actionPayload: ExecuteActionPayload) =>
      dispatch(executeAction(actionPayload)),
    updateWidget: (
      operation: WidgetOperation,
      widgetId: string,
      payload: any,
    ) => dispatch(updateWidget(operation, widgetId, payload)),
    updateWidgetMetaProperty: (
      widgetId: string,
      propertyName: string,
      propertyValue: any,
    ) =>
      dispatch(updateWidgetMetaProperty(widgetId, propertyName, propertyValue)),
    resetChildrenMetaProperty: (widgetId: string) =>
      dispatch(resetChildrenMetaProperty(widgetId)),
    disableDrag: (disable: boolean) => {
      dispatch(disableDragAction(disable));
    },
    deleteWidgetProperty: (widgetId: string, propertyPaths: string[]) =>
      dispatch(deletePropertyAction(widgetId, propertyPaths)),
    batchUpdateWidgetProperty: (
      widgetId: string,
      updates: BatchPropertyUpdatePayload,
    ) => {
      dispatch(batchUpdatePropertyAction(widgetId, updates));
    },
  };
};

export default connect(null, mapDispatchToProps)(EditorContextProvider);
