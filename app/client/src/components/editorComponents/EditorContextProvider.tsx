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

import {
  getOccupiedSpaces,
  getPaginatedWidgets,
} from "selectors/editorSelectors";
import { PaginationField } from "api/ActionAPI";
import { updateWidgetMetaProperty } from "actions/metaActions";

export type EditorContextType = {
  executeAction?: (
    actionPayloads: ActionPayload[],
    paginationField?: PaginationField,
  ) => void;
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
  disableDrag?: (disable: boolean) => void;
  occupiedSpaces?: { [containerWidgetId: string]: OccupiedSpace[] };
  paginatedWidgets?: string[];
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
    paginatedWidgets,
    disableDrag,
    children,
  } = props;
  return (
    <EditorContext.Provider
      value={{
        executeAction,
        updateWidget,
        updateWidgetProperty,
        updateWidgetMetaProperty,
        occupiedSpaces,
        paginatedWidgets,
        disableDrag,
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
    paginatedWidgets: getPaginatedWidgets(
      state.entities.actions.map(action => action.config),
      state.entities.canvasWidgets,
    ),
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
    updateWidgetMetaProperty: (
      widgetId: string,
      propertyName: string,
      propertyValue: any,
    ) =>
      dispatch(updateWidgetMetaProperty(widgetId, propertyName, propertyValue)),
    executeAction: (
      actionPayloads: ActionPayload[],
      paginationField?: PaginationField,
    ) => dispatch(executeAction(actionPayloads, paginationField)),
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
