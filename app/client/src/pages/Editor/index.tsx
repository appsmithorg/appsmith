import React, { Component } from "react"
import styled from "styled-components"
import Canvas from "./Canvas"
import WidgetCardsPane from "./WidgetCardsPane"
import EditorHeader from "./EditorHeader"
import { CALCULATOR } from "@blueprintjs/icons/lib/esm/generated/iconContents";

const ArtBoard = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0px 10px;
`;

class Editor extends Component {
  render() {
    return (
      <div style={{

      }}>
        <EditorHeader></EditorHeader>
      <div style={{ 
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "flex-start",
        width: "100vw",
        overflow: "hidden",
        padding: "10px",
        height: "calc(100vh - 60px)"}}>
        <WidgetCardsPane />
        <ArtBoard>
          <Canvas />
        </ArtBoard>
      </div>
      </div>
    )
  }
}

export default Editor
