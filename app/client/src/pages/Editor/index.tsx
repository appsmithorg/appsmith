import React, { Component } from "react";
import { Position, Toaster } from "@blueprintjs/core";
import { connect } from "react-redux";
import styled from "styled-components";
import Canvas from "./Canvas";
import {
  WidgetCardProps,
  WidgetProps,
  WidgetOperation,
} from "../../widgets/BaseWidget";
import { AppState } from "../../reducers";
import { EditorReduxState } from "../../reducers/uiReducers/editorReducer";
import WidgetCardsPane from "./WidgetCardsPane";
import EditorHeader from "./EditorHeader";
import CanvasWidgetsNormalizer from "../../normalizers/CanvasWidgetsNormalizer";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { fetchPage, updateWidget, savePage } from "../../actions/pageActions";
import { RenderModes } from "../../constants/WidgetConstants";
import { executeAction } from "../../actions/widgetActions";
import { ActionPayload } from "../../constants/ActionConstants";
import PropertyPane from "./PropertyPane";

const SaveToast = Toaster.create({
  position: Position.TOP,
});

const CanvasContainer = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: auto;
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
  dsl: ContainerWidgetProps<WidgetProps> | any;
  fetchCanvasWidgets: Function;
  executeAction: (actionPayloads?: ActionPayload[]) => void;
  updateWidget: Function;
  cards: { [id: string]: WidgetCardProps[] } | any;
  savePageLayout: Function;
  page: string;
  currentPageId: string;
  currentLayoutId: string;
  isSaving: boolean;
};

class Editor extends Component<EditorProps> {
  componentDidMount() {
    this.props.fetchCanvasWidgets(this.props.currentPageId);
  }

  componentDidUpdate(prevProps: EditorProps) {
    if (this.props.isSaving && prevProps.isSaving !== this.props.isSaving) {
      SaveToast.clear();
      SaveToast.show({ message: "Saving Page..." });
    } else if (
      !this.props.isSaving &&
      prevProps.isSaving !== this.props.isSaving
    ) {
      SaveToast.clear();
      SaveToast.show({ message: "Page Saved" });
    }
  }

  public render() {
    return (
      <React.Fragment>
        <EditorHeader></EditorHeader>
        <EditorWrapper>
          <WidgetCardsPane cards={this.props.cards} />
          <CanvasContainer>
            {this.props.dsl && (
              <Canvas
                dsl={this.props.dsl}
                widgetFunctions={{
                  executeAction: this.props.executeAction,
                  updateWidget: this.props.updateWidget,
                }}
              />
            )}
          </CanvasContainer>
          <PropertyPane />
        </EditorWrapper>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): EditorReduxState => {
  // TODO(abhinav) : Benchmark this, see how many times this is called in the application
  // lifecycle. Move to using flattend redux state for widgets if necessary.

  // Also, try to merge the widgetCards and widgetConfigs in the fetch Saga.
  // No point in storing widgetCards, without widgetConfig
  // Alternatively, try to see if we can continue to use only WidgetConfig and eliminate WidgetCards

  const dsl = CanvasWidgetsNormalizer.denormalize(
    state.ui.editor.pageWidgetId,
    state.entities,
  );
  const configs = state.entities.widgetConfig.config;

  const cards = state.ui.widgetCardsPane.cards;
  Object.keys(cards).forEach((group: string) => {
    cards[group] = cards[group].map((widget: WidgetCardProps) => ({
      ...widget,
      ...configs[widget.type],
    }));
  });

  return {
    cards,
    dsl,
    pageWidgetId: state.ui.editor.pageWidgetId,
    currentPageId: state.ui.editor.currentPageId,
    currentLayoutId: state.ui.editor.currentLayoutId,
    isSaving: state.ui.editor.isSaving,
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
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Editor);
