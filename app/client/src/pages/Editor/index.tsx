import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
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
  getIsEditorInitialized,
  getIsPublishingApplication,
} from "selectors/editorSelectors";
import {
  Dialog,
  Classes,
  AnchorButton,
  Hotkey,
  Hotkeys,
  HotkeysTarget,
  Spinner,
} from "@blueprintjs/core";
import { initEditor } from "actions/initActions";
import { editorInitializer } from "utils/EditorUtils";
import {
  ENTITY_EXPLORER_SEARCH_ID,
  WIDGETS_SEARCH_ID,
} from "constants/Explorer";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
import ConfirmRunModal from "pages/Editor/ConfirmRunModal";
import * as Sentry from "@sentry/react";
import {
  copyWidget,
  pasteWidget,
  deleteSelectedWidget,
  cutWidget,
} from "actions/widgetActions";
import { isMac } from "utils/helpers";

type EditorProps = {
  currentApplicationId?: string;
  currentPageId?: string;
  initEditor: Function;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  errorPublishing: boolean;
  copySelectedWidget: () => void;
  pasteCopiedWidget: () => void;
  deleteSelectedWidget: () => void;
  cutSelectedWidget: () => void;
  user?: User;
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;
@HotkeysTarget
class Editor extends Component<Props> {
  public renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          global={true}
          combo="meta + f"
          label="Search entities"
          onKeyDown={(e: any) => {
            const entitySearchInput = document.getElementById(
              ENTITY_EXPLORER_SEARCH_ID,
            );
            const widgetSearchInput = document.getElementById(
              WIDGETS_SEARCH_ID,
            );
            if (entitySearchInput) entitySearchInput.focus();
            if (widgetSearchInput) widgetSearchInput.focus();
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        <Hotkey
          global={true}
          combo="meta + c"
          label="Copy Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            this.props.copySelectedWidget();
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          global={true}
          combo="meta + v"
          label="Paste Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            this.props.pasteCopiedWidget();
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          global={true}
          combo="del"
          label="Delete Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            if (!isMac()) this.props.deleteSelectedWidget();
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          global={true}
          combo="backspace"
          label="Delete Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            if (isMac()) this.props.deleteSelectedWidget();
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          global={true}
          combo="del"
          label="Delete Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            this.props.deleteSelectedWidget();
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          global={true}
          combo="meta + x"
          label="Cut Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            this.props.cutSelectedWidget();
          }}
          preventDefault
          stopPropagation
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
  componentDidUpdate(previously: Props) {
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
    nextProps: Props,
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
  public render() {
    if (!this.props.isEditorInitialized || !this.state.registered) {
      return (
        <CenteredWrapper style={{ height: "calc(100vh - 48px)" }}>
          <Spinner />
        </CenteredWrapper>
      );
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
        <ConfirmRunModal />
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
  user: getCurrentUser(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string, pageId: string) =>
      dispatch(initEditor(applicationId, pageId)),
    copySelectedWidget: () => dispatch(copyWidget(true)),
    pasteCopiedWidget: () => dispatch(pasteWidget()),
    deleteSelectedWidget: () => dispatch(deleteSelectedWidget(true)),
    cutSelectedWidget: () => dispatch(cutWidget()),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(Editor)),
);
