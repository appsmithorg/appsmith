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
import { fetchPage, savePage, updateWidget } from "../../actions/pageActions";
import {
  getPropertyPaneConfigsId,
  getCurrentLayoutId,
  getCurrentPageId,
  getDenormalizedDSL,
  getCurrentPageName,
  getPageWidgetId,
} from "../../selectors/editorSelectors";
import { RenderModes } from "../../constants/WidgetConstants";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import {
  EditorConfigIdsType,
  fetchEditorConfigs,
} from "../../actions/configsActions";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";

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
  fetchCanvasWidgets: Function;
  executeAction: (actionPayloads?: ActionPayload[]) => void;
  updateWidget: Function;
  savePageLayout: Function;
  currentPageName: string;
  currentPageId: string;
  currentLayoutId: string;
  showPropertyPane: (
    widgetId?: string,
    node?: HTMLDivElement,
    toggle?: boolean,
  ) => void;
  fetchConfigs: Function;
  propertyPaneConfigsId: string;
};

export const WidgetFunctionsContext: Context<WidgetFunctions> = createContext(
  {},
);

class WidgetsEditor extends React.Component<EditorProps> {
  componentDidMount() {
    this.props.fetchConfigs({
      propertyPaneConfigsId: this.props.propertyPaneConfigsId,
      // widgetCardsPaneId: this.props.widgetCardsPaneId,
      // widgetConfigsId: this.props.widgetConfigsId,
    });
    this.props.fetchCanvasWidgets(this.props.currentPageId);
  }

  render(): React.ReactNode {
    return (
      <WidgetFunctionsContext.Provider
        value={{
          executeAction: this.props.executeAction,
          updateWidget: this.props.updateWidget,
        }}
      >
        <EditorWrapper>
          <CanvasContainer>
            {this.props.dsl && (
              <Canvas
                dsl={this.props.dsl}
                showPropertyPane={this.props.showPropertyPane}
              />
            )}
          </CanvasContainer>
          <PropertyPane />
        </EditorWrapper>
      </WidgetFunctionsContext.Provider>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    dsl: getDenormalizedDSL(state),
    pageWidgetId: getPageWidgetId(state),
    currentPageId: getCurrentPageId(state),
    currentLayoutId: getCurrentLayoutId(state),
    currentPageName: getCurrentPageName(state),
    propertyPaneConfigsId: getPropertyPaneConfigsId(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    executeAction: (actionPayloads?: ActionPayload[]) =>
      dispatch(executeAction(actionPayloads)),
    fetchCanvasWidgets: (pageId: string) =>
      dispatch(fetchPage(pageId, RenderModes.CANVAS)),
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
    fetchConfigs: (configsIds: EditorConfigIdsType) =>
      dispatch(fetchEditorConfigs(configsIds)),
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
