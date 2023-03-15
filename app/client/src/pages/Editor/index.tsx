import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import { Spinner } from "@blueprintjs/core";
import type { BuilderRouteParams } from "constants/routes";
import type { AppState } from "@appsmith/reducers";
import MainContainer from "./MainContainer";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  getIsEditorLoading,
  getIsPublishingApplication,
  getPublishingError,
} from "selectors/editorSelectors";
import type { InitializeEditorPayload } from "actions/initActions";
import { initEditor, resetEditorRequest } from "actions/initActions";
import { editorInitializer } from "utils/editor/EditorUtils";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import RequestConfirmationModal from "pages/Editor/RequestConfirmationModal";
import * as Sentry from "@sentry/react";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import type { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "./GlobalHotKeys";
import GitSyncModal from "pages/Editor/gitSync/GitSyncModal";
import DisconnectGitModal from "pages/Editor/gitSync/DisconnectGitModal";
import { fetchPage, updateCurrentPage } from "actions/pageActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getSearchQuery } from "utils/helpers";
import { loading } from "selectors/onboardingSelectors";
import GuidedTourModal from "./GuidedTour/DeviationModal";
import RepoLimitExceededErrorModal from "./gitSync/RepoLimitExceededErrorModal";
import ImportedApplicationSuccessModal from "./gitSync/ImportedAppSuccessModal";
import { getIsBranchUpdated } from "../utils";
import { APP_MODE } from "entities/App";
import { GIT_BRANCH_QUERY_KEY } from "constants/routes";
import TemplatesModal from "pages/Templates/TemplatesModal";
import ReconnectDatasourceModal from "./gitSync/ReconnectDatasourceModal";
import MultiPaneContainer from "pages/Editor/MultiPaneContainer";
import { isMultiPaneActive } from "selectors/multiPaneSelectors";

type EditorProps = {
  currentApplicationId?: string;
  currentApplicationName?: string;
  initEditor: (payload: InitializeEditorPayload) => void;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  isEditorInitializeError: boolean;
  errorPublishing: boolean;
  loadingGuidedTour: boolean;
  user?: User;
  lightTheme: Theme;
  resetEditorRequest: () => void;
  fetchPage: (pageId: string) => void;
  updateCurrentPage: (pageId: string) => void;
  handleBranchChange: (branch: string) => void;
  currentPageId?: string;
  pageLevelSocketRoomId: string;
  isMultiPane: boolean;
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<Props> {
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
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

    const { applicationId, pageId } = this.props.match.params;
    if (pageId)
      this.props.initEditor({
        applicationId,
        pageId,
        branch,
        mode: APP_MODE.EDIT,
      });
  }

  shouldComponentUpdate(nextProps: Props, nextState: { registered: boolean }) {
    const isBranchUpdated = getIsBranchUpdated(
      this.props.location,
      nextProps.location,
    );

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
      nextState.registered !== this.state.registered
    );
  }

  componentDidUpdate(prevProps: Props) {
    const { applicationId, pageId } = this.props.match.params || {};
    const { pageId: prevPageId } = prevProps.match.params || {};
    const isBranchUpdated = getIsBranchUpdated(
      this.props.location,
      prevProps.location,
    );

    const branch = getSearchQuery(
      this.props.location.search,
      GIT_BRANCH_QUERY_KEY,
    );
    const prevBranch = getSearchQuery(
      prevProps.location.search,
      GIT_BRANCH_QUERY_KEY,
    );

    const isPageIdUpdated = pageId !== prevPageId;

    // to prevent re-init during connect
    if (prevBranch && isBranchUpdated && pageId) {
      this.props.initEditor({
        applicationId,
        pageId,
        branch,
        mode: APP_MODE.EDIT,
      });
    } else {
      /**
       * First time load is handled by init sagas
       * If we don't check for `prevPageId`: fetch page is re triggered
       * when redirected to the default page
       */
      if (prevPageId && pageId && isPageIdUpdated) {
        this.props.updateCurrentPage(pageId);
        this.props.fetchPage(pageId);
      }
    }
  }

  componentWillUnmount() {
    this.props.resetEditorRequest();
  }

  public render() {
    if (
      !this.props.isEditorInitialized ||
      !this.state.registered ||
      this.props.loadingGuidedTour
    ) {
      return (
        <CenteredWrapper
          style={{ height: `calc(100vh - ${theme.smallHeaderHeight})` }}
        >
          <Spinner />
        </CenteredWrapper>
      );
    }
    return (
      <ThemeProvider theme={theme}>
        <div>
          <Helmet>
            <meta charSet="utf-8" />
            <title>
              {`${this.props.currentApplicationName} |`} Editor | Appsmith
            </title>
          </Helmet>
          <GlobalHotKeys>
            {this.props.isMultiPane ? (
              <MultiPaneContainer />
            ) : (
              <MainContainer />
            )}
            <GitSyncModal />
            <DisconnectGitModal />
            <GuidedTourModal />
            <RepoLimitExceededErrorModal />
            <TemplatesModal />
            <ImportedApplicationSuccessModal />
            <ReconnectDatasourceModal />
          </GlobalHotKeys>
        </div>
        <RequestConfirmationModal />
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
  loadingGuidedTour: loading(state),
  isMultiPane: isMultiPaneActive(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (payload: InitializeEditorPayload) =>
      dispatch(initEditor(payload)),
    resetEditorRequest: () => dispatch(resetEditorRequest()),
    fetchPage: (pageId: string) => dispatch(fetchPage(pageId)),
    updateCurrentPage: (pageId: string) => dispatch(updateCurrentPage(pageId)),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(Editor)),
);
