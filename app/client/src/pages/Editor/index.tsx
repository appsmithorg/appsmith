import React, { Component } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { AppState } from "../../reducers";
import EditorHeader from "./EditorHeader";
import EditorsRouter from "./routes";
import NavBar from "../../components/editor/NavBar";
import WidgetsEditor from "./WidgetsEditor";
import {
  getCurrentApplicationId,
  getCurrentLayoutId,
  getCurrentPageId,
} from "../../selectors/editorSelectors";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";

const MainContainer = styled.div`
  display: flex;
`;

type EditorProps = {
  currentPageName: string;
  isSaving: boolean;
  currentApplicationId?: string;
  currentLayoutId: string;
  currentPageId: string;
  publishApplication: Function;
  previewPage: Function;
};

class Editor extends Component<EditorProps> {
  handlePublish = () => {
    if (this.props.currentApplicationId)
      this.props.publishApplication(this.props.currentApplicationId);
  };
  handlePreview = () => {
    this.props.previewPage(
      this.props.currentPageId,
      this.props.currentLayoutId,
    );
    //TODO(abhinav): Add logic to open in a different tab.
  };
  public render() {
    return (
      <div>
        <EditorHeader
          notificationText={this.props.isSaving ? "Saving page..." : undefined}
          pageName={this.props.currentPageName}
          onPublish={this.handlePublish}
          onPreview={this.handlePreview}
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

const mapStateToProps = (state: AppState) => ({
  currentPageName: state.ui.editor.currentPageName,
  isSaving: state.ui.editor.isSaving,
  currentApplicationId: getCurrentApplicationId(state),
  currentPageId: getCurrentPageId(state),
  currentLayoutId: getCurrentLayoutId(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    publishApplication: (applicationId: string) => {
      dispatch({
        type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
        payload: {
          applicationId,
        },
      });
    },
    previewPage: (pageId: string, layoutId: string) => {
      dispatch({
        type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
        payload: {
          pageId,
          layoutId,
        },
      });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Editor);
