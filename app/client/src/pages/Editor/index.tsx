import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { withRouter, RouteComponentProps } from "react-router-dom";
import {
  BuilderRouteParams,
  getApplicationViewerPageURL,
} from "constants/routes";
import { AppState } from "reducers";
import MainContainer from "./MainContainer";
import { DndProvider } from "react-dnd";
import TouchBackend from "react-dnd-touch-backend";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPublishingError,
  getIsEditorLoading,
  getLoadingError,
  getIsEditorInitialized,
  getIsPublishingApplication,
} from "selectors/editorSelectors";
import { Dialog, Classes, AnchorButton } from "@blueprintjs/core";
import { initEditor } from "actions/initActions";
import { fetchPage } from "actions/pageActions";
import { editorInitializer } from "utils/EditorUtils";

type EditorProps = {
  currentApplicationId?: string;
  currentPageId?: string;
  initEditor: Function;
  fetchPage: (pageId: string) => void;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  editorLoadingError: boolean;
  errorPublishing: boolean;
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<Props> {
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
  componentDidUpdate(previously: Props) {
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
  currentApplicationId: getCurrentApplicationId(state),
  currentPageId: getCurrentPageId(state),
  isPublishing: getIsPublishingApplication(state),
  errorPublishing: getPublishingError(state),
  isEditorLoading: getIsEditorLoading(state),
  isEditorInitialized: getIsEditorInitialized(state),
  editorLoadingError: getLoadingError(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string, pageId: string) =>
      dispatch(initEditor(applicationId, pageId)),
    fetchPage: (pageId: string) => dispatch(fetchPage(pageId)),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Editor));
