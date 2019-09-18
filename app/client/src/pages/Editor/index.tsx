import React, { Component } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import Canvas from "./Canvas";
import {
  WidgetCardProps,
  WidgetProps,
  WidgetDynamicProperty,
} from "../../widgets/BaseWidget";
import { AppState } from "../../reducers";
import { EditorReduxState } from "../../reducers/uiReducers/editorReducer";
import WidgetCardsPane from "./WidgetCardsPane";
import EditorHeader from "./EditorHeader";
import CanvasWidgetsNormalizer from "../../normalizers/CanvasWidgetsNormalizer";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { fetchPage, updateWidget, savePage } from "../../actions/pageActions";
import { RenderModes } from "../../constants/WidgetConstants";
import EditorDragLayer from "./EditorDragLayer";

const CanvasContainer = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0px 10px;
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    pointer-events: none;
  }
`;

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  width: 100vw;
  overflow: hidden;
  padding: 10px;
  height: calc(100vh - 60px);
`;

type EditorProps = {
  layout: ContainerWidgetProps<WidgetProps> | any;
  fetchCanvasWidgets: Function;
  cards: { [id: string]: WidgetCardProps[] } | any;
  updateWidgetProperty: Function;
  savePageLayout: Function;
  page: string;
  currentPageId: string;
  currentLayoutId: string;
};

class Editor extends Component<EditorProps> {
  componentDidMount() {
    this.props.fetchCanvasWidgets(this.props.currentPageId);
  }

  public render() {
    return (
      <React.Fragment>
        <EditorHeader></EditorHeader>
        <EditorWrapper>
          <WidgetCardsPane cards={this.props.cards} />
          <EditorDragLayer />
          <CanvasContainer>
            <Canvas
              layout={{
                ...this.props.layout,
                onPropertyChange: this.props.updateWidgetProperty,
              }}
            />
          </CanvasContainer>
        </EditorWrapper>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): EditorReduxState => {
  const layout = CanvasWidgetsNormalizer.denormalize(
    state.ui.editor.pageWidgetId,
    state.entities,
  );
  return {
    cards: state.ui.widgetCardsPane.cards,
    layout,
    pageWidgetId: state.ui.editor.pageWidgetId,
    currentPageId: state.ui.editor.currentPageId,
    currentLayoutId: state.ui.editor.currentLayoutId,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    fetchCanvasWidgets: (pageId: string) =>
      dispatch(fetchPage(pageId, RenderModes.CANVAS)),
    updateWidgetProperty: (
      propertyType: WidgetDynamicProperty,
      widgetProps: WidgetProps,
      payload: any,
    ) => dispatch(updateWidget(propertyType, widgetProps, payload)),
    savePageLayout: (
      pageId: string,
      layoutId: string,
      dsl: ContainerWidgetProps<WidgetProps>,
    ) => dispatch(savePage(pageId, layoutId, dsl)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Editor);
