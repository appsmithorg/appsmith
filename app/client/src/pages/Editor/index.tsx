import React, { Component } from "react"
import Canvas from "./Canvas"
import WidgetPane from "./WidgetPane"

class Editor extends Component {
  render() {
    return (
      <div style={{ display: "flex", flexDirection: "row-reverse" }}>
        <Canvas />
        <WidgetPane />
      </div>
    )
  }
}

export default Editor
