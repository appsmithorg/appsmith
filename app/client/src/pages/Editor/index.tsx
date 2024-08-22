import React, { Component } from "react";

import * as Sentry from "@sentry/react";
import type { InitEditorActionPayload } from "actions/initActions";
import { initEditorAction, resetEditorRequest } from "actions/initActions";
import { setupPageAction, updateCurrentPage } from "actions/pageActions";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { PartialExportModal } from "components/editorComponents/PartialImportExport/PartialExportModal";
import { PartialImportModal } from "components/editorComponents/PartialImportExport/PartialImportModal";
import type { Theme } from "constants/DefaultTheme";
import type { BuilderRouteParams } from "constants/routes";
import { GIT_BRANCH_QUERY_KEY } from "constants/routes";
import type { User } from "constants/userConstants";
import DisableCDModal from "ee/components/gitComponents/DisableCDModal";
import ReconfigureCDKeyModal from "ee/components/gitComponents/ReconfigureCDKeyModal";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { AppCURLImportModal } from "ee/pages/Editor/CurlImport";
import type { AppState } from "ee/reducers";
import { APP_MODE } from "entities/App";
import type { Page } from "entities/Page";
import SignpostingOverlay from "pages/Editor/FirstTimeUserOnboarding/Overlay";
import RequestConfirmationModal from "pages/Editor/RequestConfirmationModal";
import DisconnectGitModal from "pages/Editor/gitSync/DisconnectGitModal";
import GitSyncModal from "pages/Editor/gitSync/GitSyncModal";
import TemplatesModal from "pages/Templates/TemplatesModal";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  getIsEditorLoading,
  getIsPublishingApplication,
  getPageList,
  getPublishingError,
} from "selectors/editorSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ThemeMode, getTheme } from "selectors/themeSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { ThemeProvider } from "styled-components";
import { getSearchQuery } from "utils/helpers";

import { Spinner } from "@appsmith/ads";

import { widgetInitialisationSuccess } from "../../actions/widgetActions";
import { editorInitializer } from "../../utils/editor/EditorUtils";
import { getIsBranchUpdated } from "../utils";
import GlobalHotKeys from "./GlobalHotKeys";
import IDE from "./IDE";
import DisableAutocommitModal from "./gitSync/DisableAutocommitModal";
import GitSettingsModal from "./gitSync/GitSettingsModal";
import ImportedApplicationSuccessModal from "./gitSync/ImportSuccessModal";
import ReconnectDatasourceModal from "./gitSync/ReconnectDatasourceModal";
import RepoLimitExceededErrorModal from "./gitSync/RepoLimitExceededErrorModal";

interface EditorProps {
  currentApplicationId?: string;
  currentApplicationName?: string;
  initEditor: (payload: InitEditorActionPayload) => void;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  isEditorInitializeError: boolean;
  errorPublishing: boolean;
  loadingGuidedTour: boolean;
  user?: User;
  lightTheme: Theme;
  resetEditorRequest: () => void;
  setupPage: (pageId: string) => void;
  updateCurrentPage: (pageId: string) => void;
  handleBranchChange: (branch: string) => void;
  currentPageId?: string;
  pageLevelSocketRoomId: string;
  isMultiPane: boolean;
  widgetConfigBuildSuccess: () => void;
  pages: Page[];
}

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<Props> {
  componentDidMount() {
    const { basePageId } = this.props.match.params || {};
    urlBuilder.setCurrentBasePageId(basePageId);

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
      nextProps.match?.params?.basePageId !==
        this.props.match?.params?.basePageId ||
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
    const { baseApplicationId, basePageId } = this.props.match.params || {};
    const { basePageId: prevPageBaseId } = prevProps.match.params || {};
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

    const isPageIdUpdated = basePageId !== prevPageBaseId;

    // to prevent re-init during connect
    if (prevBranch && isBranchUpdated && basePageId) {
      this.props.initEditor({
        baseApplicationId,
        basePageId,
        branch,
        mode: APP_MODE.EDIT,
      });
    } else {
      /**
       * First time load is handled by init sagas
       * If we don't check for `prevPageId`: fetch page is re triggered
       * when redirected to the default page
       */
      if (
        prevPageBaseId &&
        basePageId &&
        isPageIdUpdated &&
        this.props.pages.length
      ) {
        const pageId = this.props.pages.find(
          (page) => page.basePageId === basePageId,
        )?.pageId;
        if (pageId) {
          this.props.updateCurrentPage(pageId);
          this.props.setupPage(pageId);
          urlBuilder.setCurrentBasePageId(basePageId);
        }
      }
    }
  }

  componentWillUnmount() {
    this.props.resetEditorRequest();
    urlBuilder.setCurrentBasePageId(null);
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
      <ThemeProvider theme={theme}>
        <div>
          <Helmet>
            <meta charSet="utf-8" />
            <title>
              {`${this.props.currentApplicationName} | Editor | Appsmith`}
            </title>
          </Helmet>
          <GlobalHotKeys>
            <IDE />
            <GitSyncModal />
            <GitSettingsModal />
            <DisableCDModal />
            <ReconfigureCDKeyModal />
            <DisconnectGitModal />
            <DisableAutocommitModal />
            <RepoLimitExceededErrorModal />
            <TemplatesModal />
            <ImportedApplicationSuccessModal />
            <ReconnectDatasourceModal />
            <SignpostingOverlay />
            <PartialExportModal />
            <PartialImportModal />
            <AppCURLImportModal />
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
  pages: getPageList(state),
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (payload: InitEditorActionPayload) =>
      dispatch(initEditorAction(payload)),
    resetEditorRequest: () => dispatch(resetEditorRequest()),
    setupPage: (pageId: string) => dispatch(setupPageAction(pageId)),
    updateCurrentPage: (pageId: string) => dispatch(updateCurrentPage(pageId)),
    widgetConfigBuildSuccess: () => dispatch(widgetInitialisationSuccess()),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(Editor)),
);
