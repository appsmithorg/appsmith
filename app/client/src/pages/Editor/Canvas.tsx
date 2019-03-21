import React, { Component } from "react"
import { connect } from "react-redux"
import { AppState } from "../../reducers"
import WidgetFactory from "../../utils/WidgetFactory"
import { loadCanvas } from "../../actions/CanvasActions";
import CanvasResponse from "../../mockResponses/CanvasResponse";
import { denormalize } from "normalizr";
import CanvasWidgetsNormalizer, { widgetSchema } from "../../normalizers/CanvasWidgetsNormalizer";
import { IContainerWidgetProps } from "../../widgets/ContainerWidget";

class Canvas extends Component<{ pageWidget: IContainerWidgetProps<any>, loadCanvas: Function }> {

  componentDidMount() {
    this.props.loadCanvas()
  }

  render() {
    const pageWidget = this.props.pageWidget
    return (
      <div>
        {pageWidget
          ? WidgetFactory.createWidget(pageWidget)
          : undefined}
      </div>
    )
  }
}

const mapStateToProps = (state: AppState, props: any) => {
  const pageWidget = CanvasWidgetsNormalizer.denormalize(state.ui.canvas.pageWidgetId, state.entities)
  return {
    pageWidget: pageWidget
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    loadCanvas: () => {
      dispatch(loadCanvas({ pageWidget: CanvasResponse }))
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Canvas)
