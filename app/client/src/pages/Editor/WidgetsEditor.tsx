import React, { Context, createContext } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import Canvas from "./Canvas";
import PropertyPane from "./PropertyPane";
import { AppState } from "../../reducers";
import {
  WidgetFunctions,
  WidgetOperation,
  WidgetProps,
} from "../../widgets/BaseWidget";
import { ActionPayload } from "../../constants/ActionConstants";
import { executeAction } from "../../actions/widgetActions";
import { savePage, updateWidget } from "../../actions/pageActions";
import { getDenormalizedDSL } from "../../selectors/editorSelectors";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";
import { updateWidgetProperty } from "../../actions/controlActions";
import { RenderModes } from "../../constants/WidgetConstants";

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - ${props => props.theme.headerHeight});
`;

const CanvasContainer = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  margin: 10px 0;
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

type EditorProps = {
  dsl: ContainerWidgetProps<WidgetProps> | any;
  executeAction: (actionPayloads?: ActionPayload[]) => void;
  updateWidget: Function;
  updateWidgetProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  savePageLayout: Function;
  showPropertyPane: (
    widgetId?: string,
    node?: HTMLDivElement,
    toggle?: boolean,
  ) => void;
};

export const WidgetFunctionsContext: Context<WidgetFunctions> = createContext(
  {},
);

const WidgetsEditor = (props: EditorProps) => (
  <WidgetFunctionsContext.Provider
    value={{
      executeAction: props.executeAction,
      updateWidget: props.updateWidget,
      updateWidgetProperty: props.updateWidgetProperty,
    }}
  >
    <EditorWrapper>
      <CanvasContainer>
        {props.dsl && (
          <Canvas dsl={props.dsl} showPropertyPane={props.showPropertyPane} />
        )}
      </CanvasContainer>
      <PropertyPane />
    </EditorWrapper>
  </WidgetFunctionsContext.Provider>
);

const mapStateToProps = (state: AppState) => {
  return {
    dsl: getDenormalizedDSL(state),
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
    savePageLayout: (
      pageId: string,
      layoutId: string,
      dsl: ContainerWidgetProps<WidgetProps>,
    ) => dispatch(savePage(pageId, layoutId, dsl)),
    showPropertyPane: (
      widgetId?: string,
      node?: HTMLDivElement,
      toggle = false,
    ) => {
      dispatch({
        type: ReduxActionTypes.SHOW_PROPERTY_PANE,
        payload: { widgetId, node, toggle },
      });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WidgetsEditor);
