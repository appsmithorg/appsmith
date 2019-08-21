import React, { Component } from "react"
import { connect } from "react-redux"
import { AppState } from "../../reducers"
import { WidgetCardsPaneReduxState } from "../../reducers/uiReducers/widgetCardsPaneReducer";

class WidgetCardsPane extends Component<WidgetCardsPaneReduxState> {
  render() {
    const groups = Object.keys(this.props.cards)
    return (<div style={{ width: "300px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0px 0px 3px #ccc", padding: "5px 10px", display: "flex", flexFlow: "row wrap" }}>
      {groups.map((group: string) => {
          
      })}
    </div>)
  }
}

const mapStateToProps = (state: AppState, props: any): WidgetCardsPaneReduxState => {
  return {
    cards: state.ui.widgetCardsPane.cards
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WidgetCardsPane)
