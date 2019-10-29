import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "../../reducers";
import EditorHeader from "./EditorHeader";
import MainContainer from "./MainContainer";
import {
  getCurrentApplicationId,
  getCurrentLayoutId,
  getCurrentPageId,
} from "../../selectors/editorSelectors";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";

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
        <MainContainer />
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
