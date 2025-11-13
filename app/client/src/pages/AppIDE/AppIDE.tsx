import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import type { BuilderRouteParams } from "constants/routes";
import type { DefaultRootState } from "react-redux";
import IDE from "./layouts";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  getIsEditorLoading,
  getIsPublishingApplication,
  getPageList,
  getPublishingError,
} from "selectors/editorSelectors";
import type { InitEditorActionPayload } from "actions/initActions";
import { initEditorAction, resetEditorRequest } from "actions/initActions";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import RequestConfirmationModal from "pages/Editor/RequestConfirmationModal";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import type { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
import { setupPageAction, updateCurrentPage } from "actions/pageActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getSearchQuery } from "utils/helpers";
import { getIsBranchUpdated } from "../utils";
import { APP_MODE } from "entities/App";
import { GIT_BRANCH_QUERY_KEY } from "constants/routes";
import { Spinner } from "@appsmith/ads";
import { editorInitializer } from "utils/editor/EditorUtils";
import { widgetInitialisationSuccess } from "actions/widgetActions";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import type { Page } from "entities/Page";
import { IDE_HEADER_HEIGHT } from "@appsmith/ads";
import { GitApplicationContextProvider } from "git-artifact-helpers/application/components";
import { AppIDEModals } from "ee/pages/AppIDE/components/AppIDEModals";
import { updateWindowDimensions } from "actions/windowActions";

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
  updateWindowDimensions: (height: number, width: number) => void;
}

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<Props> {
  prevPageId: string | null = null;

  componentDidMount() {
    const { basePageId, staticPageSlug } = this.props.match.params || {};

    // If basePageId is not available but staticPageSlug is, try to find the basePageId from the slug
    let resolvedBasePageId = basePageId;

    if (!resolvedBasePageId && staticPageSlug) {
      const matchingPage = this.props.pages.find(
        (page) => page.uniqueSlug === staticPageSlug,
      );

      resolvedBasePageId = matchingPage?.basePageId;
    }

    urlBuilder.setCurrentBasePageId(resolvedBasePageId);

    editorInitializer().then(() => {
      this.props.widgetConfigBuildSuccess();
    });

    // Set initial window dimensions
    this.props.updateWindowDimensions(window.innerHeight, window.innerWidth);
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
      nextProps.match?.params?.staticPageSlug !==
        this.props.match?.params?.staticPageSlug ||
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
    const { baseApplicationId, basePageId, staticPageSlug } =
      this.props.match.params || {};
    const { basePageId: prevBasePageId, staticPageSlug: prevStaticPageSlug } =
      prevProps.match.params || {};

    // Resolve basePageId from staticPageSlug if needed
    let resolvedBasePageId = basePageId;

    if (!resolvedBasePageId && staticPageSlug) {
      const matchingPage = this.props.pages.find(
        (page) => page.uniqueSlug === staticPageSlug,
      );

      resolvedBasePageId = matchingPage?.basePageId;
    }

    let prevResolvedBasePageId = prevBasePageId;

    if (!prevResolvedBasePageId && prevStaticPageSlug) {
      const matchingPage = prevProps.pages.find(
        (page) => page.uniqueSlug === prevStaticPageSlug,
      );

      prevResolvedBasePageId = matchingPage?.basePageId;
    }

    const pageId = this.props.pages.find(
      (page) => page.basePageId === resolvedBasePageId,
    )?.pageId;

    const prevPageId = prevProps.pages.find(
      (page) => page.basePageId === prevResolvedBasePageId,
    )?.pageId;

    // caching value for prevPageId as it is required in future lifecycles
    if (prevPageId) {
      this.prevPageId = prevPageId;
    }

    const isPageIdUpdated = pageId !== this.prevPageId;
    const isBasePageIdUpdated = resolvedBasePageId !== prevResolvedBasePageId;
    const isPageUpdated = isPageIdUpdated || isBasePageIdUpdated;

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

    // to prevent re-init during connect
    if (prevBranch && isBranchUpdated && resolvedBasePageId) {
      this.props.initEditor({
        baseApplicationId,
        basePageId: resolvedBasePageId,
        branch,
        mode: APP_MODE.EDIT,
        staticApplicationSlug: this.props.match.params.staticApplicationSlug,
        staticPageSlug: this.props.match.params.staticPageSlug,
      });
    } else {
      /**
       * First time load is handled by init sagas
       * If we don't check for `prevPageId`: fetch page is re triggered
       * when redirected to the default page
       */
      if (pageId && this.prevPageId && isPageUpdated) {
        // For static URLs, we need to call initEditor to trigger consolidated API
        // with static slug parameters, not just updateCurrentPage and setupPage
        if (
          this.props.match.params.staticApplicationSlug &&
          this.props.match.params.staticPageSlug
        ) {
          this.props.initEditor({
            baseApplicationId,
            basePageId: resolvedBasePageId,
            branch,
            mode: APP_MODE.EDIT,
            staticApplicationSlug:
              this.props.match.params.staticApplicationSlug,
            staticPageSlug: this.props.match.params.staticPageSlug,
          });
        } else {
          // For regular URLs, use the existing updateCurrentPage and setupPage
          this.props.updateCurrentPage(pageId);
          this.props.setupPage(pageId);
          urlBuilder.setCurrentBasePageId(resolvedBasePageId);
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
          style={{ height: `calc(100vh - ${IDE_HEADER_HEIGHT}px)` }}
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
          <GitApplicationContextProvider>
            <GlobalHotKeys>
              <IDE />
              <AppIDEModals />
            </GlobalHotKeys>
          </GitApplicationContextProvider>
        </div>
        <RequestConfirmationModal />
      </ThemeProvider>
    );
  }
}

const theme = getTheme(ThemeMode.LIGHT);

const mapStateToProps = (state: DefaultRootState) => ({
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
    setupPage: (pageId: string) => dispatch(setupPageAction({ id: pageId })),
    updateCurrentPage: (pageId: string) => dispatch(updateCurrentPage(pageId)),
    widgetConfigBuildSuccess: () => dispatch(widgetInitialisationSuccess()),
    updateWindowDimensions: (height: number, width: number) =>
      dispatch(updateWindowDimensions(height, width)),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Editor));
