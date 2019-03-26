import React, { Component } from "react"
import { connect } from "react-redux"
import { AppState } from "../../reducers"
import WidgetFactory from "../../utils/WidgetFactory"
import CanvasWidgetsNormalizer, { widgetSchema } from "../../normalizers/CanvasWidgetsNormalizer";
import { IContainerWidgetProps } from "../../widgets/ContainerWidget";
import { action } from "../../index"
import { ActionTypes } from "../../constants/ActionConstants";

class Canvas extends Component<{ pageWidget: IContainerWidgetProps<any>, loadCanvas: Function }> {

  componentDidMount() {
    action(ActionTypes.FETCH_CANVAS)
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
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Canvas)
