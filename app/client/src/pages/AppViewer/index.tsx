import React, { useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import { useDispatch } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { withRouter } from "react-router";
import type { AppState } from "@appsmith/reducers";
import type {
  AppViewerRouteParams,
  BuilderRouteParams,
} from "constants/routes";
import { GIT_BRANCH_QUERY_KEY } from "constants/routes";
import {
  getIsInitialized,
  getAppViewHeaderHeight,
} from "selectors/appViewSelectors";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import AppViewerPageContainer from "./AppViewerPageContainer";
import * as Sentry from "@sentry/react";
import {
  getCurrentPageDescription,
  getViewModePageList,
} from "selectors/editorSelectors";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { getSearchQuery } from "utils/helpers";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useSelector } from "react-redux";
import BrandingBadge from "./BrandingBadge";
import { setAppViewHeaderHeight } from "actions/appViewActions";
import { showPostCompletionMessage } from "selectors/onboardingSelectors";
import { CANVAS_SELECTOR } from "constants/WidgetConstants";
import { setupPublishedPage } from "actions/pageActions";
import usePrevious from "utils/hooks/usePrevious";
import { getIsBranchUpdated } from "../utils";
import { APP_MODE } from "entities/App";
import { initAppViewer } from "actions/initActions";
import { WidgetGlobaStyles } from "globalStyles/WidgetGlobalStyles";
import useWidgetFocus from "utils/hooks/useWidgetFocus/useWidgetFocus";
import HtmlTitle from "./AppViewerHtmlTitle";
import BottomBar from "components/BottomBar";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import { editorInitializer } from "../../utils/editor/EditorUtils";
import { widgetInitialisationSuccess } from "../../actions/widgetActions";
import {
  areEnvironmentsFetched,
  getEnvironmentsWithPermission,
} from "@appsmith/selectors/environmentSelectors";
import type { FontFamily } from "@design-system/theming";
import {
  ThemeProvider as WDSThemeProvider,
  useTheme,
} from "@design-system/theming";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { RAMP_NAME } from "utils/ProductRamps/RampsControlList";
import { showProductRamps } from "@appsmith/selectors/rampSelectors";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { KBViewerFloatingButton } from "@appsmith/pages/AppViewer/KnowledgeBase/KBViewerFloatingButton";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import { getHideWatermark } from "@appsmith/selectors/tenantSelectors";

const AppViewerBody = styled.section<{
  hasPages: boolean;
  headerHeight: number;
  showGuidedTourMessage: boolean;
  showBottomBar: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  height: calc(
    100vh -
      ${(props) => (props.showBottomBar ? props.theme.bottomBarHeight : "0px")} -
      ${({ headerHeight }) => headerHeight}px
  );
  --view-mode-header-height: ${({ headerHeight }) => headerHeight}px;
`;

const AppViewerBodyContainer = styled.div<{
  width?: string;
  backgroundColor: string;
}>`
  flex: 1;
  overflow: auto;
  margin: 0 auto;
  background: ${({ backgroundColor }) => backgroundColor};
`;

export type AppViewerProps = RouteComponentProps<BuilderRouteParams>;

type Props = AppViewerProps & RouteComponentProps<AppViewerRouteParams>;

const DEFAULT_FONT_NAME = "System Default";

function AppViewer(props: Props) {
  const dispatch = useDispatch();
  const { pathname, search } = props.location;
  const { applicationId, pageId } = props.match.params;
  const isInitialized = useSelector(getIsInitialized);
  const pages = useSelector(getViewModePageList);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const lightTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );
  const showGuidedTourMessage = useSelector(showPostCompletionMessage);
  const headerHeight = useSelector(getAppViewHeaderHeight);
  const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);
  const prevValues = usePrevious({ branch, location: props.location, pageId });
  const hideWatermark = useSelector(getHideWatermark);
  const pageDescription = useSelector(getCurrentPageDescription);
  const currentApplicationDetails: ApplicationPayload | undefined = useSelector(
    getCurrentApplication,
  );
  const { theme } = useTheme({
    borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
    seedColor: selectedTheme.properties.colors.primaryColor,
    fontFamily: selectedTheme.properties.fontFamily.appFont as FontFamily,
  });
  const focusRef = useWidgetFocus();

  const showRampSelector = showProductRamps(RAMP_NAME.MULTIPLE_ENV, true);
  const canShowRamp = useSelector(showRampSelector);

  const workspaceId = currentApplicationDetails?.workspaceId || "";
  const isMultipleEnvEnabled = useFeatureFlag(
    FEATURE_FLAG.release_datasource_environments_enabled,
  );
  const environmentList = useSelector(getEnvironmentsWithPermission);
  // If there is only one environment and it is default, don't show the bottom bar
  const isOnlyDefaultShown =
    environmentList.length === 1 && environmentList[0]?.isDefault;
  const showBottomBar = useSelector((state: AppState) => {
    return (
      areEnvironmentsFetched(state, workspaceId) &&
      (isMultipleEnvEnabled || canShowRamp) &&
      environmentList.length > 0 &&
      !isOnlyDefaultShown
    );
  });

  /**
   * initializes the widgets factory and registers all widgets
   */
  useEffect(() => {
    editorInitializer().then(() => {
      dispatch(widgetInitialisationSuccess());
    });
  }, []);
  /**
   * initialize the app if branch, pageId or application is changed
   */
  useEffect(() => {
    const prevBranch = prevValues?.branch;
    const prevLocation = prevValues?.location;
    const prevPageId = prevValues?.pageId;
    let isBranchUpdated = false;
    if (prevBranch && prevLocation) {
      isBranchUpdated = getIsBranchUpdated(props.location, prevLocation);
    }

    const isPageIdUpdated = pageId !== prevPageId;

    if (prevBranch && isBranchUpdated && (applicationId || pageId)) {
      dispatch(
        initAppViewer({
          applicationId,
          branch,
          pageId,
          mode: APP_MODE.PUBLISHED,
        }),
      );
    } else {
      /**
       * First time load is handled by init sagas
       * If we don't check for `prevPageId`: fetch page is retriggered
       * when redirected to the default page
       */
      if (prevPageId && pageId && isPageIdUpdated) {
        dispatch(setupPublishedPage(pageId, true));
      }
    }
  }, [branch, pageId, applicationId, pathname]);

  useEffect(() => {
    urlBuilder.setCurrentPageId(pageId);

    return () => {
      urlBuilder.setCurrentPageId(null);
    };
  }, [pageId]);

  useEffect(() => {
    const header = document.querySelector(".js-appviewer-header");

    dispatch(setAppViewHeaderHeight(header?.clientHeight || 0));
  }, [pages.length, isInitialized]);

  /**
   * returns the font to be used for the canvas
   */
  const appFontFamily =
    selectedTheme.properties.fontFamily.appFont === DEFAULT_FONT_NAME
      ? "inherit"
      : selectedTheme.properties.fontFamily.appFont;

  /**
   * loads font for canvas based on theme
   */
  useEffect(() => {
    document.body.style.fontFamily = `${appFontFamily}, sans-serif`;

    return function reset() {
      document.body.style.fontFamily = "inherit";
    };
  }, [selectedTheme.properties.fontFamily.appFont]);

  const isWDSV2Enabled = useFeatureFlag("ab_wds_enabled");
  const backgroundForBody = isWDSV2Enabled
    ? "var(--color-bg)"
    : selectedTheme.properties.colors.backgroundColor;

  return (
    <WDSThemeProvider theme={theme}>
      <ThemeProvider theme={lightTheme}>
        <EditorContextProvider renderMode="PAGE">
          {!isWDSV2Enabled && (
            <WidgetGlobaStyles
              fontFamily={selectedTheme.properties.fontFamily.appFont}
              primaryColor={selectedTheme.properties.colors.primaryColor}
            />
          )}
          <HtmlTitle
            description={pageDescription}
            name={currentApplicationDetails?.name}
          />
          <AppViewerBodyContainer backgroundColor={backgroundForBody}>
            <AppViewerBody
              className={CANVAS_SELECTOR}
              hasPages={pages.length > 1}
              headerHeight={headerHeight}
              ref={focusRef}
              showBottomBar={!!showBottomBar}
              showGuidedTourMessage={showGuidedTourMessage}
            >
              {isInitialized && <AppViewerPageContainer />}
            </AppViewerBody>
            {showBottomBar && <BottomBar viewMode />}
            <div
              className={`fixed hidden right-8 z-3 md:flex ${
                showBottomBar ? "bottom-12" : "bottom-4"
              }`}
            >
              {!hideWatermark && (
                <a
                  className="hover:no-underline"
                  href="https://appsmith.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <BrandingBadge />
                </a>
              )}
              <KBViewerFloatingButton />
            </div>
          </AppViewerBodyContainer>
        </EditorContextProvider>
      </ThemeProvider>
    </WDSThemeProvider>
  );
}

export default withRouter(Sentry.withProfiler(AppViewer));
