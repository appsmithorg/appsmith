import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
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
  getIsPublishingApplication,
  getPublishingError,
  getIsEditorLoading,
  getIsEditorInitialized,
} from "selectors/editorSelectors";

import {
  Dialog,
  Classes,
  AnchorButton,
  Hotkey,
  Hotkeys,
  HotkeysTarget,
} from "@blueprintjs/core";
import { initEditor } from "actions/initActions";
import { editorInitializer } from "utils/EditorUtils";

type EditorProps = {
  currentApplicationId?: string;
  currentPageId?: string;
  initEditor: Function;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  errorPublishing: boolean;
} & RouteComponentProps<BuilderRouteParams>;

@HotkeysTarget
class Editor extends Component<EditorProps> {
  public renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          global={true}
          combo="meta + f"
          label="Search entities"
          onKeyDown={(e: any) => {
            //TODO(abhinav): make this id into a constant.
            const el = document.getElementById("entity-explorer-search");
            el?.focus();
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </Hotkeys>
    );
  }
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
  }

  shouldComponentUpdate(
    nextProps: EditorProps,
    nextState: { isDialogOpen: boolean; registered: boolean },
  ) {
    return (
      nextProps.currentPageId !== this.props.currentPageId ||
      nextProps.currentApplicationId !== this.props.currentApplicationId ||
      nextProps.isEditorInitialized !== this.props.isEditorInitialized ||
      nextProps.isPublishing !== this.props.isPublishing ||
      nextProps.isEditorLoading !== this.props.isEditorLoading ||
      nextProps.errorPublishing !== this.props.errorPublishing ||
      nextState.isDialogOpen !== this.state.isDialogOpen ||
      nextState.registered !== this.state.registered
    );
  }

  handleDialogClose = () => {
    this.setState({
      isDialogOpen: false,
    });
  };

  redirectToPage = (pageId: string) => {
    if (this.props.currentApplicationId) {
      this.props.history.push(
        BUILDER_PAGE_URL(this.props.currentApplicationId, pageId),
      );
    }
  };
  public render() {
    if (!this.props.isEditorInitialized || !this.state.registered) return null;
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
            currentPageId={this.props.currentPageId}
            currentApplicationId={this.props.currentApplicationId}
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
                {"Your application is now published with the current changes!"}
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
  currentApplicationId: getCurrentApplicationId(state),
  currentPageId: getCurrentPageId(state),
  errorPublishing: getPublishingError(state),
  isPublishing: getIsPublishingApplication(state),
  isEditorLoading: getIsEditorLoading(state),
  isEditorInitialized: getIsEditorInitialized(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string, pageId: string) =>
      dispatch(initEditor(applicationId, pageId)),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Editor));
