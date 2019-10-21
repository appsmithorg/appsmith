import React, { Component } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { AppState } from "../../reducers";
import EditorHeader from "./EditorHeader";
import EditorsRouter from "./routes";
import NavBar from "../../components/editor/NavBar";
import WidgetsEditor from "./WidgetsEditor";

const MainContainer = styled.div`
  display: flex;
`;

type EditorProps = {
  currentPageName: string;
  isSaving: boolean;
};

class Editor extends Component<EditorProps> {
  public render() {
    return (
      <div>
        <EditorHeader
          notificationText={this.props.isSaving ? "Saving page..." : undefined}
          pageName={this.props.currentPageName}
        />
        <MainContainer>
          <NavBar />
          <EditorsRouter />
          <WidgetsEditor />
        </MainContainer>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState): EditorProps => ({
  currentPageName: state.ui.editor.currentPageName,
  isSaving: state.ui.editor.isSaving,
});

export default connect(mapStateToProps)(Editor);
