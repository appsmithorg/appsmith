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
import RequestConfirmationModal from "pages/Editor/RequestConfirmationModal";
import * as Sentry from "@sentry/react";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "./GlobalHotKeys";
import { handlePathUpdated } from "actions/recentEntityActions";
import AddCommentTourComponent from "comments/tour/AddCommentTourComponent";
import CommentShowCaseCarousel from "comments/CommentsShowcaseCarousel";
import GitSyncModal from "pages/Editor/gitSync/GitSyncModal";
import DisconnectGitModal from "pages/Editor/gitSync/DisconnectGitModal";

import history from "utils/history";
import { fetchPage, updateCurrentPage } from "actions/pageActions";

import { getCurrentPageId } from "selectors/editorSelectors";

import { getSearchQuery } from "utils/helpers";
import ConcurrentPageEditorToast from "comments/ConcurrentPageEditorToast";
import { getIsPageLevelSocketConnected } from "selectors/websocketSelectors";
import {
  collabStartSharingPointerEvent,
  collabStopSharingPointerEvent,
} from "actions/appCollabActions";
import { loading } from "selectors/onboardingSelectors";
import GuidedTourModal from "./GuidedTour/DeviationModal";
import { getPageLevelSocketRoomId } from "sagas/WebsocketSagas/utils";
import RepoLimitExceededErrorModal from "./gitSync/RepoLimitExceededErrorModal";

type EditorProps = {
  currentApplicationId?: string;
  currentApplicationName?: string;
  initEditor: (applicationId: string, pageId: string, branch?: string) => void;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  isEditorInitializeError: boolean;
  errorPublishing: boolean;
  loadingGuidedTour: boolean;
  user?: User;
  lightTheme: Theme;
  resetEditorRequest: () => void;
  handlePathUpdated: (location: typeof window.location) => void;
  fetchPage: (pageId: string) => void;
  updateCurrentPage: (pageId: string) => void;
  handleBranchChange: (branch: string) => void;
  currentPageId?: string;
  isPageLevelSocketConnected: boolean;
  collabStartSharingPointerEvent: (pageId: string) => void;
  collabStopSharingPointerEvent: (pageId?: string) => void;
  pageLevelSocketRoomId: string;
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

    const {
      location: { search },
    } = this.props;
    const branch = getSearchQuery(search, "branch");

    const { applicationId, pageId } = this.props.match.params;
    if (applicationId) {
      this.props.initEditor(applicationId, pageId, branch);
    }
    this.props.handlePathUpdated(window.location);
    this.unlisten = history.listen(this.handleHistoryChange);

    if (this.props.isPageLevelSocketConnected && pageId) {
      this.props.collabStartSharingPointerEvent(
        getPageLevelSocketRoomId(pageId, branch),
      );
    }
  }

  getIsBranchUpdated(props1: Props, props2: Props) {
    const {
      location: { search: search1 },
    } = props1;
    const {
      location: { search: search2 },
    } = props2;

    const branch1 = getSearchQuery(search1, "branch");
    const branch2 = getSearchQuery(search2, "branch");

    return branch1 !== branch2;
  }

  shouldComponentUpdate(nextProps: Props, nextState: { registered: boolean }) {
    const isBranchUpdated = this.getIsBranchUpdated(this.props, nextProps);

    return (
      isBranchUpdated ||
      nextProps.currentApplicationName !== this.props.currentApplicationName ||
      nextProps.match?.params?.pageId !== this.props.match?.params?.pageId ||
      nextProps.currentApplicationId !== this.props.currentApplicationId ||
      nextProps.isEditorInitialized !== this.props.isEditorInitialized ||
      nextProps.isPublishing !== this.props.isPublishing ||
      nextProps.isEditorLoading !== this.props.isEditorLoading ||
      nextProps.errorPublishing !== this.props.errorPublishing ||
      nextProps.isEditorInitializeError !==
        this.props.isEditorInitializeError ||
      nextProps.loadingGuidedTour !== this.props.loadingGuidedTour ||
      nextState.registered !== this.state.registered ||
      (nextProps.isPageLevelSocketConnected &&
        !this.props.isPageLevelSocketConnected)
    );
  }

  componentDidUpdate(prevProps: Props) {
    const { applicationId, pageId } = this.props.match.params || {};
    const { pageId: prevPageId } = prevProps.match.params || {};
    const isBranchUpdated = this.getIsBranchUpdated(this.props, prevProps);

    const branch = getSearchQuery(this.props.location.search, "branch");
    const prevBranch = getSearchQuery(prevProps.location.search, "branch");

    const isPageIdUpdated = pageId !== prevPageId;

    // to prevent re-init during connect
    if (prevBranch && isBranchUpdated && applicationId) {
      this.props.initEditor(applicationId, pageId, branch);
    } else {
      /**
       * First time load is handled by init sagas
       * If we don't check for `prevPageId`: fetch page is retriggered
       * when redirected to the default page
       */
      if (prevPageId && pageId && isPageIdUpdated) {
        this.props.updateCurrentPage(pageId);
        this.props.fetchPage(pageId);
      }
    }

    if (this.props.isPageLevelSocketConnected && isPageIdUpdated) {
      this.props.collabStartSharingPointerEvent(
        getPageLevelSocketRoomId(pageId, branch),
      );
    }
  }

  componentWillUnmount() {
    const { pageId } = this.props.match.params || {};
    const {
      location: { search },
    } = this.props;
    const branch = getSearchQuery(search, "branch");
    this.props.resetEditorRequest();
    if (typeof this.unlisten === "function") this.unlisten();
    this.props.collabStopSharingPointerEvent(
      getPageLevelSocketRoomId(pageId, branch),
    );
  }

  handleHistoryChange = (location: any) => {
    this.props.handlePathUpdated(location);
  };

  public render() {
    if (
      !this.props.isEditorInitialized ||
      !this.state.registered ||
      this.props.loadingGuidedTour
    ) {
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
              <AddCommentTourComponent />
              <CommentShowCaseCarousel />
              <GitSyncModal />
              <DisconnectGitModal />
              <ConcurrentPageEditorToast />
              <GuidedTourModal />
              <RepoLimitExceededErrorModal />
            </GlobalHotKeys>
          </div>
          <RequestConfirmationModal />
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
  currentApplicationName: state.ui.applications.currentApplication?.name,
  currentPageId: getCurrentPageId(state),
  isPageLevelSocketConnected: getIsPageLevelSocketConnected(state),
  loadingGuidedTour: loading(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string, pageId: string, branch?: string) =>
      dispatch(initEditor(applicationId, pageId, branch)),
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
