import React, { Component } from "react"
import { connect } from "react-redux"
import { AppState } from "../../reducers"
import WidgetFactory from "../../utils/WidgetFactory"
import { WidgetPaneReduxState } from "../../reducers/uiReducers/widgetPaneReducer";
import { IWidgetProps } from "../../widgets/BaseWidget";

class WidgetPane extends Component<WidgetPaneReduxState> {
  render() {
    return (<div style={{ height: "600px", width: "300px", backgroundColor: "#f4f4f4", position: "absolute", top: 100 }}>
      {this.props.widgets.map((widget: IWidgetProps) => {
        return WidgetFactory.createWidget(widget)
      })}
    </div>)
  }
}

const mapStateToProps = (state: AppState, props: any): WidgetPaneReduxState => {
  return {
    widgets: state.ui.widgetPane.widgets
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WidgetPane)
