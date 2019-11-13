import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import Canvas from "./Canvas";
import PropertyPane from "./PropertyPane";
import { AppState } from "../../reducers";
import { WidgetProps } from "../../widgets/BaseWidget";
import { savePage } from "../../actions/pageActions";
import { getDenormalizedDSL } from "../../selectors/editorSelectors";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";

import EditorContextProvider from "components/editorComponents/EditorContextProvider";

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
  savePageLayout: Function;
  showPropertyPane: (
    widgetId?: string,
    node?: HTMLDivElement,
    toggle?: boolean,
  ) => void;
};

const WidgetsEditor = (props: EditorProps) => (
  <EditorContextProvider>
    <EditorWrapper>
      <CanvasContainer>
        {props.dsl && (
          <Canvas dsl={props.dsl} showPropertyPane={props.showPropertyPane} />
        )}
      </CanvasContainer>
      <PropertyPane />
    </EditorWrapper>
  </EditorContextProvider>
);

const mapStateToProps = (state: AppState) => {
  return {
    dsl: getDenormalizedDSL(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
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
