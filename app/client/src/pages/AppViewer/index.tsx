import React, { useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import { useDispatch } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { withRouter } from "react-router";
import type { AppState } from "ee/reducers";
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
  getIsAutoLayout,
  getPageList,
} from "selectors/editorSelectors";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { getSearchQuery } from "utils/helpers";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useSelector } from "react-redux";
import BrandingBadge from "./BrandingBadge";
import { setAppViewHeaderHeight } from "actions/appViewActions";
import { CANVAS_SELECTOR } from "constants/WidgetConstants";
import { fetchPublishedPageResources } from "actions/pageActions";
import usePrevious from "utils/hooks/usePrevious";
import { getIsBranchUpdated } from "../utils";
import { APP_MODE } from "entities/App";
import { initAppViewerAction } from "actions/initActions";
import { WidgetGlobaStyles } from "globalStyles/WidgetGlobalStyles";
import useWidgetFocus from "utils/hooks/useWidgetFocus/useWidgetFocus";
import HtmlTitle from "./AppViewerHtmlTitle";
import type { ApplicationPayload } from "entities/Application";
import {
  getAppThemeSettings,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import { editorInitializer } from "../../utils/editor/EditorUtils";
import { widgetInitialisationSuccess } from "../../actions/widgetActions";
import {
  ThemeProvider as WDSThemeProvider,
  useTheme,
} from "@appsmith/wds-theming";
import { KBViewerFloatingButton } from "ee/pages/AppViewer/KnowledgeBase/KBViewerFloatingButton";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { getHideWatermark } from "ee/selectors/tenantSelectors";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

const AppViewerBody = styled.section<{
  hasPages: boolean;
  headerHeight: number;
  $contain: string;
}>`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  height: calc(100vh - ${({ headerHeight }) => headerHeight}px);
  --view-mode-header-height: ${({ headerHeight }) => headerHeight}px;
  contain: ${({ $contain }) => $contain};
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
  const { baseApplicationId, basePageId } = props.match.params;
  const isInitialized = useSelector(getIsInitialized);
  const pages = useSelector(getPageList);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const lightTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );
  const headerHeight = useSelector(getAppViewHeaderHeight);
  const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);
  const prevValues = usePrevious({
    branch,
    location: props.location,
    basePageId,
  });
  const hideWatermark = useSelector(getHideWatermark);
  const pageDescription = useSelector(getCurrentPageDescription);
  const currentApplicationDetails: ApplicationPayload | undefined = useSelector(
    getCurrentApplication,
  );
  const isAnvilLayout = useSelector(getIsAnvilLayout);
  const themeSetting = useSelector(getAppThemeSettings);
  const wdsThemeProps = {
    borderRadius: themeSetting.borderRadius,
    seedColor: themeSetting.accentColor,
    colorMode: themeSetting.colorMode.toLowerCase(),
    userSizing: themeSetting.sizing,
    userDensity: themeSetting.density,
  } as Parameters<typeof useTheme>[0];
  const { theme } = useTheme(isAnvilLayout ? wdsThemeProps : {});

  const focusRef = useWidgetFocus();
  const isAutoLayout = useSelector(getIsAutoLayout);

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
    const prevPageBaseId = prevValues?.basePageId;
    let isBranchUpdated = false;

    if (prevBranch && prevLocation) {
      isBranchUpdated = getIsBranchUpdated(props.location, prevLocation);
    }

    const isPageIdUpdated = basePageId !== prevPageBaseId;

    if (prevBranch && isBranchUpdated && (baseApplicationId || basePageId)) {
      dispatch(
        initAppViewerAction({
          baseApplicationId,
          branch,
          basePageId,
          mode: APP_MODE.PUBLISHED,
        }),
      );
    } else {
      /**
       * First time load is handled by init sagas
       * If we don't check for `prevPageId`: fetch page is retriggered
       * when redirected to the default page
       */
      if (prevPageBaseId && basePageId && isPageIdUpdated) {
        const pageId = pages.find(
          (page) => page.basePageId === basePageId,
        )?.pageId;

        if (pageId) {
          dispatch(
            fetchPublishedPageResources({
              basePageId,
              pageId,
            }),
          );
        }
      }
    }
  }, [branch, basePageId, baseApplicationId, pathname]);

  useEffect(() => {
    urlBuilder.setCurrentBasePageId(basePageId);

    return () => {
      urlBuilder.setCurrentBasePageId(null);
    };
  }, [basePageId]);

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

  const renderChildren = () => {
    return (
    <div style={{ direction: "rtl" }}>
      <EditorContextProvider renderMode="PAGE">
        {!isAnvilLayout && (
          <WidgetGlobaStyles
            fontFamily={selectedTheme.properties.fontFamily.appFont}
            primaryColor={selectedTheme.properties.colors.primaryColor}
          />
        )}
        <HtmlTitle
          description={pageDescription}
          name={currentApplicationDetails?.name}
        />
        <AppViewerBodyContainer
          backgroundColor={
            isAnvilLayout ? "" : selectedTheme.properties.colors.backgroundColor
          }
        >
          <AppViewerBody
            $contain={isAutoLayout ? "content" : "strict"}
            className={CANVAS_SELECTOR}
            hasPages={pages.length > 1}
            headerHeight={headerHeight}
            ref={focusRef}
          >
            {isInitialized && <AppViewerPageContainer />}
          </AppViewerBody>
        </AppViewerBodyContainer>
      </EditorContextProvider>
    </div>
    );
  };

  if (isAnvilLayout) {
    return (
      <WDSThemeProvider theme={theme}>{renderChildren()}</WDSThemeProvider>
    );
  }

  return <ThemeProvider theme={lightTheme}>{renderChildren()}</ThemeProvider>;
}

export default withRouter(Sentry.withProfiler(AppViewer));
