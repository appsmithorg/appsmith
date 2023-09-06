import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import type { BuilderRouteParams } from "constants/routes";
import type { AppState } from "@appsmith/reducers";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  getIsEditorLoading,
  getIsPublishingApplication,
  getPublishingError,
} from "selectors/editorSelectors";
import SideBar from "./Sidebar";
import DebugBar from "./BottomBar";
import LeftPane from "./LeftPane";
import MainPane from "./MainPane";
import type { InitializeEditorPayload } from "actions/initActions";
import { initEditor, resetEditorRequest } from "actions/initActions";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import * as Sentry from "@sentry/react";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import styled from "styled-components";
import type { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "../Editor/GlobalHotKeys";
import GitSyncModal from "pages/Editor/gitSync/GitSyncModal";
import DisconnectGitModal from "pages/Editor/gitSync/DisconnectGitModal";
import { fetchPage, updateCurrentPage } from "actions/pageActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getSearchQuery } from "utils/helpers";
import { loading } from "selectors/onboardingSelectors";
import RepoLimitExceededErrorModal from "../Editor/gitSync/RepoLimitExceededErrorModal";
import ImportedApplicationSuccessModal from "../Editor/gitSync/ImportedAppSuccessModal";
import { getIsBranchUpdated } from "../utils";
import { APP_MODE } from "entities/App";
import { GIT_BRANCH_QUERY_KEY } from "constants/routes";
import TemplatesModal from "pages/Templates/TemplatesModal";
import ReconnectDatasourceModal from "../Editor/gitSync/ReconnectDatasourceModal";
import { Spinner } from "design-system";
import { editorInitializer } from "../../utils/editor/EditorUtils";
import { widgetInitialisationSuccess } from "../../actions/widgetActions";
import { getIdeSidebarWidth } from "./ideSelector";

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
  leftPaneWidth: number;
  user?: User;
  lightTheme: Theme;
  resetEditorRequest: () => void;
  fetchPage: (pageId: string) => void;
  updateCurrentPage: (pageId: string) => void;
  handleBranchChange: (branch: string) => void;
  currentPageId?: string;
  pageLevelSocketRoomId: string;
  isMultiPane: boolean;
  widgetConfigBuildSuccess: () => void;
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

const Body = styled.div<{ leftPaneWidth: number }>`
  height: calc(100vh - 40px);
  padding-top: 4px;
  background: #f1f5f9;
  display: grid;
  grid-template-columns: 50px ${(props) => props.leftPaneWidth || 300}px auto;
  grid-template-rows: 1fr 37px;
  grid-gap: 4px;
`;

class Editor extends Component<Props> {
  componentDidMount() {
    editorInitializer().then(() => {
      this.props.widgetConfigBuildSuccess();
    });
  }
  shouldComponentUpdate(nextProps: Props) {
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
      nextProps.loadingGuidedTour !== this.props.loadingGuidedTour
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
    if (!this.props.isEditorInitialized || this.props.loadingGuidedTour) {
      return (
        <CenteredWrapper
          style={{ height: `calc(100vh - ${theme.smallHeaderHeight})` }}
        >
          <Spinner size="lg" />
        </CenteredWrapper>
      );
    }
    return (
      <div>
        <Helmet>
          <meta charSet="utf-8" />
          <title>
            {`${this.props.currentApplicationName} |`} Editor | Appsmith
          </title>
        </Helmet>
        <GlobalHotKeys>
          <Body id="IDE-body" leftPaneWidth={this.props.leftPaneWidth}>
            <SideBar />
            <LeftPane />
            <MainPane />
            <DebugBar />
          </Body>
          <GitSyncModal />
          <DisconnectGitModal />
          <RepoLimitExceededErrorModal />
          <TemplatesModal />
          <ImportedApplicationSuccessModal />
          <ReconnectDatasourceModal />
        </GlobalHotKeys>
      </div>
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
  leftPaneWidth: getIdeSidebarWidth(state),
  loadingGuidedTour: loading(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (payload: InitializeEditorPayload) =>
      dispatch(initEditor(payload)),
    resetEditorRequest: () => dispatch(resetEditorRequest()),
    fetchPage: (pageId: string) => dispatch(fetchPage(pageId)),
    updateCurrentPage: (pageId: string) => dispatch(updateCurrentPage(pageId)),
    widgetConfigBuildSuccess: () => dispatch(widgetInitialisationSuccess()),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(Editor)),
);
