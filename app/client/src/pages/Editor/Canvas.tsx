import React, { Component } from "react"
import { connect } from "react-redux"
import { AppState } from "../../reducers"
import WidgetFactory from "../../utils/WidgetFactory"
import { CanvasReduxState } from "../../reducers/uiReducers/canvasReducer"

class Canvas extends Component<{ canvas: CanvasReduxState<any> }> {
  render() {
    const canvasWidgetData = this.props.canvas.canvasWidgetProps
    return (
      <div>
        {canvasWidgetData
          ? WidgetFactory.createWidget(canvasWidgetData)
          : undefined}
      </div>
    )
  }
}

const mapStateToProps = (state: AppState, props: any) => {
  return {
    canvas: state.ui.canvas
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Canvas)
