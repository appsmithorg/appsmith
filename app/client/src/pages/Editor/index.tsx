import React, { Component } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import Canvas from "./Canvas";
import { WidgetCardProps, WidgetProps } from "../../widgets/BaseWidget";
import { AppState } from "../../reducers";
import { EditorReduxState } from "../../reducers/uiReducers/editorReducer";
import WidgetCardsPane from "./WidgetCardsPane";
import EditorHeader from "./EditorHeader";
import { WidgetType } from "../../constants/WidgetConstants";
import CanvasWidgetsNormalizer from "../../normalizers/CanvasWidgetsNormalizer";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { fetchPage, addWidget } from "../../actions/pageActions";
import { RenderModes } from "../../constants/WidgetConstants";
// import EditorDragLayer  from "./EditorDragLayer"

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
  pageWidget: ContainerWidgetProps<any> | any;
  fetchCanvasWidgets: Function;
  cards: { [id: string]: WidgetCardProps[] } | any;
  addPageWidget: Function;
  page: string;
};

class Editor extends Component<EditorProps> {
  componentDidMount() {
    this.props.fetchCanvasWidgets("1");
  }

  addWidgetToCanvas = (widgetType: WidgetType, key: string): void => {
    this.props.addPageWidget("1", {
      key: key,
      bottomRow: 9,
      leftColumn: 1,
      parentColumnSpace: 90,
      parentRowSpace: 50,
      renderMode: RenderModes.CANVAS,
      rightColumn: 3,
      snapColumns: 20,
      snapRows: 20,
      children: [],
      topRow: 1,
      widgetId: key,
      widgetType: widgetType,
    });
  };

  public render() {
    return (
      <React.Fragment>
        <EditorHeader></EditorHeader>
        <EditorWrapper>
          <WidgetCardsPane cards={this.props.cards} />
          <CanvasContainer>
            <Canvas
              pageWidget={this.props.pageWidget}
              addWidget={this.addWidgetToCanvas}
            />
          </CanvasContainer>
        </EditorWrapper>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): EditorReduxState => {
  const pageWidget = CanvasWidgetsNormalizer.denormalize(
    state.ui.canvas.pageWidgetId,
    state.entities,
  );
  return {
    cards: state.ui.widgetCardsPane.cards,
    pageWidget,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    fetchCanvasWidgets: (pageId: string) =>
      dispatch(fetchPage(pageId, RenderModes.CANVAS)),
    addPageWidget: (pageId: string, widgetProps: WidgetProps) =>
      dispatch(addWidget(pageId, widgetProps)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Editor);
