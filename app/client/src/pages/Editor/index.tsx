import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { BuilderRouteParams } from "constants/routes";
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
import { Hotkey, Hotkeys, Spinner } from "@blueprintjs/core";
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
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;
@HotkeysTarget
class Editor extends Component<Props> {
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
          onKeyDown={() => {
            this.props.copySelectedWidget();
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          global={true}
          combo="mod + v"
          label="Paste Widget"
          group="Canvas"
          onKeyDown={() => {
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
          onKeyDown={() => {
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
          onKeyDown={() => {
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
          onKeyDown={() => {
            this.props.deleteSelectedWidget();
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          global={true}
          combo="mod + x"
          label="Cut Widget"
          group="Canvas"
          onKeyDown={() => {
            this.props.cutSelectedWidget();
          }}
          preventDefault
          stopPropagation
        />
      </Hotkeys>
    );
  }
  public state = {
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

  shouldComponentUpdate(nextProps: Props, nextState: { registered: boolean }) {
    return (
      nextProps.currentPageId !== this.props.currentPageId ||
      nextProps.currentApplicationId !== this.props.currentApplicationId ||
      nextProps.isEditorInitialized !== this.props.isEditorInitialized ||
      nextProps.isPublishing !== this.props.isPublishing ||
      nextProps.isEditorLoading !== this.props.isEditorLoading ||
      nextProps.errorPublishing !== this.props.errorPublishing ||
      nextProps.isEditorInitializeError !==
        this.props.isEditorInitializeError ||
      nextState.registered !== this.state.registered
    );
  }

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
