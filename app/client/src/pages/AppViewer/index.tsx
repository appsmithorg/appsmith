import React, { useEffect, useState } from "react";
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
import { editorInitializer } from "utils/editor/EditorUtils";
import * as Sentry from "@sentry/react";
import { getViewModePageList } from "selectors/editorSelectors";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import webfontloader from "webfontloader";
import { getSearchQuery } from "utils/helpers";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useSelector } from "react-redux";
import BrandingBadge from "./BrandingBadge";
import { setAppViewHeaderHeight } from "actions/appViewActions";
import { showPostCompletionMessage } from "selectors/onboardingSelectors";
import { CANVAS_SELECTOR } from "constants/WidgetConstants";
import { fetchPublishedPage } from "actions/pageActions";
import usePrevious from "utils/hooks/usePrevious";
import { getIsBranchUpdated } from "../utils";
import { APP_MODE } from "entities/App";
import { initAppViewer } from "actions/initActions";
import { WidgetGlobaStyles } from "globalStyles/WidgetGlobalStyles";
import { getAppsmithConfigs } from "@appsmith/configs";
import useWidgetFocus from "utils/hooks/useWidgetFocus/useWidgetFocus";

const AppViewerBody = styled.section<{
  hasPages: boolean;
  headerHeight: number;
  showGuidedTourMessage: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  height: calc(100vh - ${({ headerHeight }) => headerHeight}px);
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
  const [registered, setRegistered] = useState(false);
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
  const { hideWatermark } = getAppsmithConfigs();

  const focusRef = useWidgetFocus();

  /**
   * initializes the widgets factory and registers all widgets
   */
  useEffect(() => {
    editorInitializer().then(() => {
      setRegistered(true);
    });

    // onMount initPage
    if (applicationId || pageId) {
      dispatch(
        initAppViewer({
          applicationId,
          branch,
          pageId,
          mode: APP_MODE.PUBLISHED,
        }),
      );
    }
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
        dispatch(fetchPublishedPage(pageId, true));
      }
    }
  }, [branch, pageId, applicationId, pathname]);

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
    if (selectedTheme.properties.fontFamily.appFont !== DEFAULT_FONT_NAME) {
      webfontloader.load({
        google: {
          families: [
            `${selectedTheme.properties.fontFamily.appFont}:300,400,500,700`,
          ],
        },
      });
    }

    document.body.style.fontFamily = appFontFamily;

    return function reset() {
      document.body.style.fontFamily = "inherit";
    };
  }, [selectedTheme.properties.fontFamily.appFont]);

  return (
    <ThemeProvider theme={lightTheme}>
      <EditorContextProvider renderMode="PAGE">
        <WidgetGlobaStyles
          fontFamily={selectedTheme.properties.fontFamily.appFont}
          primaryColor={selectedTheme.properties.colors.primaryColor}
        />
        <AppViewerBodyContainer
          backgroundColor={selectedTheme.properties.colors.backgroundColor}
        >
          <AppViewerBody
            className={CANVAS_SELECTOR}
            hasPages={pages.length > 1}
            headerHeight={headerHeight}
            ref={focusRef}
            showGuidedTourMessage={showGuidedTourMessage}
          >
            {isInitialized && registered && <AppViewerPageContainer />}
          </AppViewerBody>
          {!hideWatermark && (
            <a
              className="fixed hidden right-8 bottom-4 z-3 hover:no-underline md:flex"
              href="https://appsmith.com"
              rel="noreferrer"
              target="_blank"
            >
              <BrandingBadge />
            </a>
          )}
        </AppViewerBodyContainer>
      </EditorContextProvider>
    </ThemeProvider>
  );
}

export default withRouter(Sentry.withProfiler(AppViewer));
