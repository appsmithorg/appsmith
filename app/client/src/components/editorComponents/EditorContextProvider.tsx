import React, { Context, createContext, ReactNode } from "react";
import { connect } from "react-redux";

import { AppState } from "reducers";

import { WidgetOperation } from "widgets/BaseWidget";

import { updateWidget } from "actions/pageActions";
import { executeAction, disableDragAction } from "actions/widgetActions";
import { updateWidgetPropertyRequest } from "actions/controlActions";

import { ExecuteActionPayload } from "constants/ActionConstants";
import { RenderModes } from "constants/WidgetConstants";
import { OccupiedSpace } from "constants/editorConstants";

import { getOccupiedSpaces } from "selectors/editorSelectors";
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
    occupiedSpaces,
    disableDrag,
    children,
    resetChildrenMetaProperty,
  } = props;
  return (
    <EditorContext.Provider
      value={{
        executeAction,
        updateWidget,
        updateWidgetProperty,
        updateWidgetMetaProperty,
        occupiedSpaces,
        disableDrag,
        resetChildrenMetaProperty,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

/**
 * TODO<Satbir>: If a property is created here, it is only available
 * in editor mode. If you need a property in published app, it
 * has to be copied in src/pages/AppViewer/index.tsx file as well.
 * Rework to avoid duplicating the property.
 */
const mapStateToProps = (state: AppState) => {
  return {
    occupiedSpaces: getOccupiedSpaces(state),
  };
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
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EditorContextProvider);
