import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
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
  getIsEditorInitialized,
  getIsEditorLoading,
  getIsPublishingApplication,
  getPublishingError,
} from "selectors/editorSelectors";
import {
  AnchorButton,
  Classes,
  Dialog,
  Hotkey,
  Hotkeys,
  Spinner,
} from "@blueprintjs/core";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
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
  cutWidget,
  deleteSelectedWidget,
  pasteWidget,
} from "actions/widgetActions";
import { isMac } from "utils/helpers";
import { getSelectedWidget } from "selectors/ui";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

type EditorProps = {
  currentApplicationId?: string;
  currentPageId?: string;
  initEditor: (applicationId: string, pageId: string) => void;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  isEditorInitializeError: boolean;
  errorPublishing: boolean;
  copySelectedWidget: () => void;
  pasteCopiedWidget: () => void;
  deleteSelectedWidget: () => void;
  cutSelectedWidget: () => void;
  user?: User;
  selectedWidget?: string;
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

const getSelectedText = () => {
  if (typeof window.getSelection === "function") {
    const selectionObj = window.getSelection();
    return selectionObj && selectionObj.toString();
  }
};

@HotkeysTarget
class Editor extends Component<Props> {
  public stopPropagationIfWidgetSelected(e: KeyboardEvent): boolean {
    if (
      this.props.selectedWidget &&
      this.props.selectedWidget != MAIN_CONTAINER_WIDGET_ID &&
      !getSelectedText()
    ) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    return false;
  }

  public renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          global={true}
          combo="mod + f"
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
          combo="mod + c"
          label="Copy Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.copySelectedWidget();
            }
          }}
        />
        <Hotkey
          global={true}
          combo="mod + v"
          label="Paste Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            this.props.pasteCopiedWidget();
          }}
        />
        <Hotkey
          global={true}
          combo="backspace"
          label="Delete Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e) && isMac()) {
              this.props.deleteSelectedWidget();
            }
          }}
        />
        <Hotkey
          global={true}
          combo="del"
          label="Delete Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.deleteSelectedWidget();
            }
          }}
        />
        <Hotkey
          global={true}
          combo="mod + x"
          label="Cut Widget"
          group="Canvas"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.cutSelectedWidget();
            }
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
      nextProps.isEditorInitializeError !==
        this.props.isEditorInitializeError ||
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
  selectedWidget: getSelectedWidget(state),
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
