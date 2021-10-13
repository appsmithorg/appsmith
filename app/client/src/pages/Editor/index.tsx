import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Spinner } from "@blueprintjs/core";
import { BuilderRouteParams } from "constants/routes";
import { AppState } from "reducers";
import MainContainer from "./MainContainer";
import { DndProvider } from "react-dnd";
import TouchBackend from "react-dnd-touch-backend";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  getIsEditorLoading,
  getIsPublishingApplication,
  getPublishingError,
} from "selectors/editorSelectors";
import { initEditor, resetEditorRequest } from "actions/initActions";
import { editorInitializer } from "utils/EditorUtils";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
import ConfirmRunModal from "pages/Editor/ConfirmRunModal";
import * as Sentry from "@sentry/react";
import Welcome from "./Welcome";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "./GlobalHotKeys";
import { handlePathUpdated } from "actions/recentEntityActions";
import AppComments from "comments/AppComments/AppComments";
import AddCommentTourComponent from "comments/tour/AddCommentTourComponent";
import CommentShowCaseCarousel from "comments/CommentsShowcaseCarousel";
import GitSyncModal from "pages/Editor/gitSync/GitSyncModal";

import history from "utils/history";
import { fetchPage, updateCurrentPage } from "actions/pageActions";

import ConcurrentPageEditorToast from "comments/ConcurrentPageEditorToast";
import { getIsPageLevelSocketConnected } from "selectors/websocketSelectors";
import {
  collabStartSharingPointerEvent,
  collabStopSharingPointerEvent,
} from "actions/appCollabActions";

type EditorProps = {
  currentApplicationId?: string;
  currentApplicationName?: string;
  initEditor: (applicationId: string, pageId: string) => void;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  isEditorInitializeError: boolean;
  errorPublishing: boolean;
  creatingOnboardingDatabase: boolean;
  user?: User;
  lightTheme: Theme;
  resetEditorRequest: () => void;
  handlePathUpdated: (location: typeof window.location) => void;
  fetchPage: (pageId: string) => void;
  updateCurrentPage: (pageId: string) => void;
  isPageLevelSocketConnected: boolean;
  collabStartSharingPointerEvent: (pageId: string) => void;
  collabStopSharingPointerEvent: (pageId?: string) => void;
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<Props> {
  unlisten: any;

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
    this.props.handlePathUpdated(window.location);
    this.unlisten = history.listen(this.handleHistoryChange);

    if (this.props.isPageLevelSocketConnected && pageId) {
      this.props.collabStartSharingPointerEvent(pageId);
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: { registered: boolean }) {
    return (
      nextProps.currentApplicationName !== this.props.currentApplicationName ||
      nextProps.match?.params?.pageId !== this.props.match?.params?.pageId ||
      nextProps.currentApplicationId !== this.props.currentApplicationId ||
      nextProps.isEditorInitialized !== this.props.isEditorInitialized ||
      nextProps.isPublishing !== this.props.isPublishing ||
      nextProps.isEditorLoading !== this.props.isEditorLoading ||
      nextProps.errorPublishing !== this.props.errorPublishing ||
      nextProps.isEditorInitializeError !==
        this.props.isEditorInitializeError ||
      nextProps.creatingOnboardingDatabase !==
        this.props.creatingOnboardingDatabase ||
      nextState.registered !== this.state.registered ||
      (nextProps.isPageLevelSocketConnected &&
        !this.props.isPageLevelSocketConnected)
    );
  }

  componentDidUpdate(prevProps: Props) {
    const { pageId } = this.props.match.params || {};
    const { pageId: prevPageId } = prevProps.match.params || {};
    const isPageIdUpdated = pageId !== prevPageId;
    if (pageId && isPageIdUpdated) {
      this.props.updateCurrentPage(pageId);
      this.props.fetchPage(pageId);
    }

    if (this.props.isPageLevelSocketConnected && isPageIdUpdated) {
      this.props.collabStartSharingPointerEvent(pageId);
    }
  }

  componentWillUnmount() {
    const { pageId } = this.props.match.params || {};
    this.props.resetEditorRequest();
    if (typeof this.unlisten === "function") this.unlisten();
    this.props.collabStopSharingPointerEvent(pageId);
  }

  handleHistoryChange = (location: any) => {
    this.props.handlePathUpdated(location);
  };

  public render() {
    if (this.props.creatingOnboardingDatabase) {
      return <Welcome />;
    }

    if (!this.props.isEditorInitialized || !this.state.registered) {
      return (
        <CenteredWrapper style={{ height: "calc(100vh - 35px)" }}>
          <Spinner />
        </CenteredWrapper>
      );
    }
    return (
      <ThemeProvider theme={theme}>
        <DndProvider
          backend={TouchBackend}
          options={{
            enableMouseEvents: true,
          }}
        >
          <div>
            <Helmet>
              <meta charSet="utf-8" />
              <title>
                {`${this.props.currentApplicationName} |`} Editor | Appsmith
              </title>
            </Helmet>
            <GlobalHotKeys>
              <MainContainer />
              <AppComments />
              <AddCommentTourComponent />
              <CommentShowCaseCarousel />
              <GitSyncModal />
              <ConcurrentPageEditorToast />
            </GlobalHotKeys>
          </div>
          <ConfirmRunModal />
        </DndProvider>
      </ThemeProvider>
    );
  }
}

const theme = getTheme(ThemeMode.LIGHT);

const mapStateToProps = (state: AppState) => ({
  currentApplicationId: getCurrentApplicationId(state),
  errorPublishing: getPublishingError(state),
  isPublishing: getIsPublishingApplication(state),
  isEditorLoading: getIsEditorLoading(state),
  isEditorInitialized: getIsEditorInitialized(state),
  user: getCurrentUser(state),
  creatingOnboardingDatabase: state.ui.onBoarding.showOnboardingLoader,
  currentApplicationName: state.ui.applications.currentApplication?.name,
  isPageLevelSocketConnected: getIsPageLevelSocketConnected(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string, pageId: string) =>
      dispatch(initEditor(applicationId, pageId)),
    resetEditorRequest: () => dispatch(resetEditorRequest()),
    handlePathUpdated: (location: typeof window.location) =>
      dispatch(handlePathUpdated(location)),
    fetchPage: (pageId: string) => dispatch(fetchPage(pageId)),
    updateCurrentPage: (pageId: string) => dispatch(updateCurrentPage(pageId)),
    collabStartSharingPointerEvent: (pageId: string) =>
      dispatch(collabStartSharingPointerEvent(pageId)),
    collabStopSharingPointerEvent: (pageId?: string) =>
      dispatch(collabStopSharingPointerEvent(pageId)),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(Editor)),
);
