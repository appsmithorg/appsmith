import React, { Component } from "react"
import { connect } from "react-redux"
import styled from "styled-components"
import Canvas from "./Canvas"
import { IWidgetCardProps, IWidgetProps } from '../../widgets/BaseWidget'
import { AppState } from "../../reducers"
import { EditorReduxState } from "../../reducers/uiReducers/editorReducer"
import WidgetCardsPane from "./WidgetCardsPane"
import EditorHeader from "./EditorHeader"
import { WidgetType } from "../../constants/WidgetConstants"
import CanvasWidgetsNormalizer from "../../normalizers/CanvasWidgetsNormalizer"
import { fetchWidgetCards } from "../../actions/widgetCardsPaneActions"
import { IContainerWidgetProps } from "../../widgets/ContainerWidget"
import { fetchPage, addWidget } from "../../actions/pageActions"
import { RenderModes } from "../../constants/WidgetConstants"
import EditorDragLayer  from "./EditorDragLayer"

const ArtBoard = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0px 10px;
  &:before {
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
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

class Editor extends Component<{
  pageWidget: IContainerWidgetProps<any> | any
  fetchCanvasWidgets: Function
  fetchWidgetCardsPane: Function
  cards: { [id: string] : IWidgetCardProps[] } | any
  addPageWidget: Function
}> {
  componentDidMount() {
    this.props.fetchWidgetCardsPane()
    this.props.fetchCanvasWidgets("1")
  }

  addWidgetToCanvas = (widgetType: WidgetType) => {
    this.props.addPageWidget("1", {
      key: "12",
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
      widgetId: "2",
      widgetType: widgetType
    })
  }

  removeWidgetFromCanvas = (widgetId: string) => {

  }

  render() {
    return (
      <React.Fragment>
        <EditorHeader></EditorHeader>
        <EditorWrapper>
          <WidgetCardsPane cards={this.props.cards} />
          <ArtBoard>
            <Canvas pageWidget={this.props.pageWidget} addWidget={this.addWidgetToCanvas} removeWidget={this.removeWidgetFromCanvas} />
            <EditorDragLayer />
          </ArtBoard>
        </EditorWrapper>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state: AppState, props: any): EditorReduxState => {
  const pageWidget = CanvasWidgetsNormalizer.denormalize(
    state.ui.canvas.pageWidgetId,
    state.entities
  )
  return {
    cards: state.ui.widgetCardsPane.cards,
    pageWidget,
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    fetchCanvasWidgets: (pageId: string) => dispatch(fetchPage(pageId, RenderModes.CANVAS)),
    fetchWidgetCardsPane: () => dispatch(fetchWidgetCards()),
    addPageWidget: (pageId:string, widgetProps: IWidgetProps) => dispatch(addWidget(pageId, widgetProps))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor)
