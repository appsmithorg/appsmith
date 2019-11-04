import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "../../reducers";
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
} from "../../selectors/editorSelectors";
import {
  ReduxActionTypes,
  PageListPayload,
} from "../../constants/ReduxActionConstants";
import { Dialog, Classes, AnchorButton } from "@blueprintjs/core";
import { initAppData } from "../../actions/initActions";

type EditorProps = {
  currentPageName: string;
  isSaving: boolean;
  currentApplicationId?: string;
  currentLayoutId: string;
  currentPageId: string;
  publishApplication: Function;
  previewPage: Function;
  initData: Function;
  createPage: Function;
  pages: PageListPayload;
  switchPage: (pageId: string) => void;
  isPublishing: boolean;
  errorPublishing: boolean;
};

class Editor extends Component<EditorProps> {
  public state = {
    isDialogOpen: false,
  };

  componentDidMount() {
    this.props.initData();
  }
  componentDidUpdate(currently: EditorProps) {
    const previously = this.props;
    if (
      !currently.isPublishing &&
      previously.isPublishing &&
      !currently.errorPublishing
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
  public render() {
    return (
      <div>
        <EditorHeader
          notificationText={this.props.isSaving ? "Saving page..." : undefined}
          pageName={this.props.currentPageName}
          onPublish={this.handlePublish}
          onCreatePage={this.handleCreatePage}
          pages={this.props.pages}
          currentPageId={this.props.currentPageId}
          switchToPage={this.props.switchPage}
          isPublishing={this.props.isPublishing}
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
              Your awesome application is now published with the current
              changes!
            </p>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <AnchorButton
                target="_blank"
                href={`/view/pages/${this.props.currentPageId}`}
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
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initData: () => dispatch(initAppData()),
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
    switchPage: (pageId: string) => {
      dispatch({
        type: ReduxActionTypes.FETCH_PAGE,
        payload: {
          pageId,
        },
      });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Editor);
