import React, { Component } from "react"
import { connect } from "react-redux"
import { AppState } from "../../reducers"
import WidgetFactory from "../../utils/WidgetFactory"
import { WidgetPaneReduxState } from "../../reducers/uiReducers/widgetPaneReducer";
import { IWidgetProps } from "../../widgets/BaseWidget";

class WidgetPane extends Component<WidgetPaneReduxState> {
  render() {
    return (<div style={{ width: "300px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0px 0px 3px #ccc", padding: "5px 10px", display: "flex", flexFlow: "row wrap" }}>
      {this.props.widgets.map((widget: IWidgetProps) => {
        
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
