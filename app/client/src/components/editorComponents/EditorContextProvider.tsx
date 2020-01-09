import React, { Context, createContext, ReactNode } from "react";
import { connect } from "react-redux";

import { AppState } from "reducers";

import { WidgetOperation } from "widgets/BaseWidget";

import { updateWidget } from "actions/pageActions";
import { executeAction, disableDragAction } from "actions/widgetActions";
import { updateWidgetProperty } from "actions/controlActions";

import { ActionPayload } from "constants/ActionConstants";
import { RenderModes } from "constants/WidgetConstants";
import { OccupiedSpace } from "constants/editorConstants";

import { getOccupiedSpaces } from "selectors/editorSelectors";

export type EditorContextType = {
  executeAction?: (actionPayloads?: ActionPayload[]) => void;
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
    occupiedSpaces,
    disableDrag,
    children,
  } = props;
  return (
    <EditorContext.Provider
      value={{
        executeAction,
        updateWidget,
        updateWidgetProperty,
        occupiedSpaces,
        disableDrag,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

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
        updateWidgetProperty(
          widgetId,
          propertyName,
          propertyValue,
          RenderModes.CANVAS,
        ),
      ),
    executeAction: (actionPayloads?: ActionPayload[]) =>
      dispatch(executeAction(actionPayloads)),
    updateWidget: (
      operation: WidgetOperation,
      widgetId: string,
      payload: any,
    ) => dispatch(updateWidget(operation, widgetId, payload)),
    disableDrag: (disable: boolean) => {
      dispatch(disableDragAction(disable));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EditorContextProvider);
