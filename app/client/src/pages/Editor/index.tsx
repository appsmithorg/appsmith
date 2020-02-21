import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { withRouter, RouteComponentProps } from "react-router-dom";
import {
  BuilderRouteParams,
  getApplicationViewerPageURL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import { AppState } from "reducers";
import EditorHeader from "./EditorHeader";
import MainContainer from "./MainContainer";
import {
  getCurrentApplicationId,
  getCurrentLayoutId,
  getCurrentPageId,
  getPageList,
  getIsPublishingApplication,
  getPublishingError,
  getIsPageSaving,
  getIsEditorLoading,
  getLoadingError,
  getPublishedTime,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import {
  ReduxActionTypes,
  PageListPayload,
} from "constants/ReduxActionConstants";
import { Dialog, Classes, AnchorButton } from "@blueprintjs/core";
import { initEditor } from "actions/initActions";

type EditorProps = {
  currentPageName?: string;
  isSaving: boolean;
  currentApplicationId?: string;
  currentLayoutId?: string;
  currentPageId?: string;
  publishApplication: Function;
  previewPage: Function;
  initEditor: Function;
  createPage: Function;
  pages: PageListPayload;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  editorLoadingError: boolean;
  errorPublishing: boolean;
  publishedTime?: string;
  isPageSwitching: boolean;
} & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<EditorProps> {
  public state = {
    isDialogOpen: false,
  };

  componentDidMount() {
    if (this.props.match.params.applicationId) {
      this.props.initEditor(this.props.match.params.applicationId);
    }
  }
  componentDidUpdate(previously: EditorProps) {
    if (
      previously.isPublishing &&
      !(this.props.isPublishing && this.props.errorPublishing)
    ) {
      this.setState({
        isDialogOpen: true,
      });
    }
  }

  handleDialogClose = () => {
    this.setState({
      isDialogOpen: false,
    });
  };
  handlePublish = () => {
    if (this.props.currentApplicationId) {
      this.props.publishApplication(this.props.currentApplicationId);
    }
  };
  handleCreatePage = (pageName: string) => {
    this.props.createPage(this.props.currentApplicationId, pageName);
  };
  redirectToPage = (pageId: string) => {
    if (this.props.currentApplicationId) {
      this.props.history.push(
        BUILDER_PAGE_URL(this.props.currentApplicationId, pageId),
      );
    }
  };
  public render() {
    if (!this.props.match.params.applicationId) {
      return <Redirect to="/applications" />;
    }
    if (!this.props.isEditorInitialized) return null;
    return (
      <div>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Editor | Appsmith</title>
        </Helmet>
        <EditorHeader
          isSaving={this.props.isSaving}
          pageName={this.props.currentPageName}
          onPublish={this.handlePublish}
          onCreatePage={this.handleCreatePage}
          pages={this.props.pages}
          currentPageId={this.props.currentPageId}
          currentApplicationId={this.props.currentApplicationId}
          isPublishing={this.props.isPublishing}
          publishedTime={this.props.publishedTime}
        />
        <MainContainer />
        <Dialog
          isOpen={this.state.isDialogOpen}
          canOutsideClickClose={true}
          canEscapeKeyClose={true}
          title="Application Published"
          onClose={this.handleDialogClose}
          icon="tick-circle"
        >
          <div className={Classes.DIALOG_BODY}>
            <p>
              {
                "Your awesome application is now published with the current changes!"
              }
            </p>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <AnchorButton
                target={this.props.currentApplicationId}
                href={getApplicationViewerPageURL(
                  this.props.currentApplicationId,
                  this.props.currentPageId,
                )}
                text="View Application"
              />
            </div>
          </div>
        </Dialog>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  currentPageName: state.ui.editor.currentPageName,
  isSaving: getIsPageSaving(state),
  currentApplicationId: getCurrentApplicationId(state),
  currentPageId: getCurrentPageId(state),
  currentLayoutId: getCurrentLayoutId(state),
  pages: getPageList(state),
  errorPublishing: getPublishingError(state),
  isPublishing: getIsPublishingApplication(state),
  isEditorLoading: getIsEditorLoading(state),
  isEditorInitialized: getIsEditorInitialized(state),
  editorLoadingError: getLoadingError(state),
  publishedTime: getPublishedTime(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string) => dispatch(initEditor(applicationId)),
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
    createPage: (applicationId: string, name: string) => {
      dispatch({
        type: ReduxActionTypes.CREATE_PAGE_INIT,
        payload: {
          applicationId,
          name,
        },
      });
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Editor));
