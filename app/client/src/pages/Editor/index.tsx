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
import { DndProvider } from "react-dnd";
import TouchBackend from "react-dnd-touch-backend";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPageList,
  getIsPublishingApplication,
  getPublishingError,
  getIsPageSaving,
  getIsEditorLoading,
  getLoadingError,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import {
  ReduxActionTypes,
  PageListPayload,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import { Dialog, Classes, AnchorButton } from "@blueprintjs/core";
import { initEditor } from "actions/initActions";
import { RenderModes } from "constants/WidgetConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { fetchPage } from "actions/pageActions";
import { editorInitializer } from "utils/EditorUtils";

type EditorProps = {
  currentPageName?: string;
  isSaving: boolean;
  currentApplicationId?: string;
  currentPageId?: string;
  publishApplication: Function;
  previewPage: Function;
  initEditor: Function;
  createPage: Function;
  fetchPage: (pageId: string) => void;
  pages: PageListPayload;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  editorLoadingError: boolean;
  errorPublishing: boolean;
  createModal: () => void;
  currentApplication?: ApplicationPayload;
} & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<EditorProps> {
  public state = {
    isDialogOpen: false,
    registered: false,
  };

  componentDidMount() {
    editorInitializer().then(() => {
      this.setState({ registered: true });
    });
    const { applicationId, pageId } = this.props.match.params;
    if (applicationId && pageId) {
      this.props.initEditor(applicationId, pageId);
    }
  }
  componentDidUpdate(previously: EditorProps) {
    if (
      previously.isPublishing &&
      !(this.props.isPublishing || this.props.errorPublishing)
    ) {
      this.setState({
        isDialogOpen: true,
      });
    }
    if (this.props.match.params.pageId !== previously.match.params.pageId) {
      this.props.fetchPage(this.props.match.params.pageId);
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

      const appName = this.props.currentApplication
        ? this.props.currentApplication.name
        : "";
      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: this.props.currentApplicationId,
        appName: appName,
      });
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
    return (
      <DndProvider
        backend={TouchBackend}
        options={{
          enableMouseEvents: true,
        }}
      >
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
            currentApplication={this.props.currentApplication}
            isPublishing={this.props.isPublishing}
            createModal={this.props.createModal}
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
      </DndProvider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  currentPageName: state.ui.editor.currentPageName,
  isSaving: getIsPageSaving(state),
  currentApplicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  currentPageId: getCurrentPageId(state),
  pages: getPageList(state),
  errorPublishing: getPublishingError(state),
  isPublishing: getIsPublishingApplication(state),
  isEditorLoading: getIsEditorLoading(state),
  isEditorInitialized: getIsEditorInitialized(state),
  editorLoadingError: getLoadingError(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string, pageId: string) =>
      dispatch(initEditor(applicationId, pageId)),
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
    fetchPage: (pageId: string) => dispatch(fetchPage(pageId)),
    createPage: (applicationId: string, name: string) => {
      dispatch({
        type: ReduxActionTypes.CREATE_PAGE_INIT,
        payload: {
          applicationId,
          name,
        },
      });
    },
    // TODO(abhinav): get the render mode from context
    createModal: () =>
      dispatch({
        type: ReduxActionTypes.CREATE_MODAL_INIT,
        payload: {
          renderMode: RenderModes.CANVAS,
        },
      }),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Editor));
