import React, { Component } from "react"
import { connect } from "react-redux"
import { AppState } from "../../reducers"
import WidgetFactory from "../../utils/WidgetFactory"
import CanvasWidgetsNormalizer, {
  widgetSchema
} from "../../normalizers/CanvasWidgetsNormalizer"
import { IContainerWidgetProps } from "../../widgets/ContainerWidget"
import { fetchPage } from "../../actions/pageActions"
import { RenderModes } from "../../constants/WidgetConstants"
import DraggableWidget from "../../widgets/DraggableWidget";

class Canvas extends Component<{
  pageWidget: IContainerWidgetProps<any>
  fetchPage: Function
}> {
  componentDidMount() {
    this.props.fetchPage("123")
  }

  render() {
    const pageWidget = this.props.pageWidget
    return (
      <div>
        {pageWidget ? WidgetFactory.createWidget(pageWidget) : undefined}
      </div>
    )
  }
}

const mapStateToProps = (state: AppState, props: any) => {
  const pageWidget = CanvasWidgetsNormalizer.denormalize(
    state.ui.canvas.pageWidgetId,
    state.entities
  )
  return {
    pageWidget: pageWidget
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    fetchPage: (pageId: string) => {
      return dispatch(fetchPage(pageId, RenderModes.CANVAS))
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Canvas)
