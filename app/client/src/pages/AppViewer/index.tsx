import React, { useMemo, useCallback, useEffect, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import { useDispatch } from "react-redux";
import { withRouter, RouteComponentProps, Route } from "react-router";
import { Switch } from "react-router-dom";
import { AppState } from "reducers";
import {
  AppViewerRouteParams,
  BuilderRouteParams,
  GIT_BRANCH_QUERY_KEY,
  VIEWER_FORK_PATH,
  VIEWER_URL,
} from "constants/routes";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getIsInitialized } from "selectors/appViewSelectors";
import { executeTrigger } from "actions/widgetActions";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppViewerPageContainer from "./AppViewerPageContainer";
import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "actions/metaActions";
import { editorInitializer } from "utils/EditorUtils";
import * as Sentry from "@sentry/react";
import { getViewModePageList } from "selectors/editorSelectors";
import AddCommentTourComponent from "comments/tour/AddCommentTourComponent";
import CommentShowCaseCarousel from "comments/CommentsShowcaseCarousel";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import GlobalHotKeys from "./GlobalHotKeys";
import webfontloader from "webfontloader";
import { getSearchQuery } from "utils/helpers";
import AppViewerCommentsSidebar from "./AppViewerComemntsSidebar";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useSelector } from "react-redux";
import PoweredBy from "./PoweredBy";
import {
  BatchPropertyUpdatePayload,
  batchUpdateWidgetProperty,
} from "actions/controlActions";

const SentryRoute = Sentry.withSentryRouting(Route);

const AppViewerBody = styled.section<{
  hasPages: boolean;
  headerHeight: number;
}>`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  height: calc(100vh - ${({ headerHeight }) => headerHeight}px);
`;

const ContainerWithComments = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  background: ${(props) => props.theme.colors.artboard};
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
  const { search } = props.location;
  const { applicationId, pageId } = props.match.params;
  const [headerHeight, setHeaderHeight] = useState(0);
  const [registered, setRegistered] = useState(false);
  const isInitialized = useSelector(getIsInitialized);
  const pages = useSelector(getViewModePageList);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const lightTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );
  const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

  /**
   * initializes the widgets factory and registers all widgets
   */
  useEffect(() => {
    editorInitializer().then(() => setRegistered(true));
  }, []);

  /**
   * initialize the app if branch, pageId or application is changed
   */
  useEffect(() => {
    if (applicationId && pageId) {
      initializeAppViewerCallback(branch, applicationId, pageId);
    }
  }, [branch, pageId, applicationId]);

  useEffect(() => {
    const header = document.querySelector(".js-appviewer-header");

    setHeaderHeight(header?.clientHeight || 0);
  }, [pages.length, isInitialized]);

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

    document.body.style.fontFamily = getAppFontFamily;
  }, [selectedTheme.properties.fontFamily.appFont]);

  /**
   * returns the font to be used for the canvas
   */
  const getAppFontFamily = useMemo(() => {
    if (selectedTheme.properties.fontFamily.appFont === DEFAULT_FONT_NAME) {
      return "inherit";
    }

    return selectedTheme.properties.fontFamily.appFont;
  }, [selectedTheme.properties.fontFamily]);

  /**
   * callback for initialize app
   */
  const initializeAppViewerCallback = useCallback(
    (branch, applicationId, pageId) => {
      dispatch({
        type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
        payload: {
          branch: branch,
          applicationId,
          pageId,
        },
      });
    },
    [dispatch],
  );

  /**
   * callback for executing an action
   */
  const executeActionCallback = useCallback(
    (actionPayload: ExecuteTriggerPayload) =>
      dispatch(executeTrigger(actionPayload)),
    [executeTrigger, dispatch],
  );

  /**
   * callback for updating widget meta property
   */
  const updateWidgetMetaPropertyCallback = useCallback(
    (widgetId: string, propertyName: string, propertyValue: any) =>
      dispatch(updateWidgetMetaProperty(widgetId, propertyName, propertyValue)),
    [],
  );

  /**
   * callback for initializing app
   */
  const resetChildrenMetaPropertyCallback = useCallback(
    (widgetId: string) => dispatch(resetChildrenMetaProperty(widgetId)),
    [resetChildrenMetaProperty, dispatch],
  );

  /**
   * callback for initializing app
   */
  const batchUpdateWidgetPropertyCallback = useCallback(
    (widgetId: string, updates: BatchPropertyUpdatePayload) =>
      dispatch(batchUpdateWidgetProperty(widgetId, updates)),
    [batchUpdateWidgetProperty, dispatch],
  );

  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalHotKeys>
        <EditorContext.Provider
          value={{
            executeAction: executeActionCallback,
            updateWidgetMetaProperty: updateWidgetMetaPropertyCallback,
            resetChildrenMetaProperty: resetChildrenMetaPropertyCallback,
            batchUpdateWidgetProperty: batchUpdateWidgetPropertyCallback,
          }}
        >
          <ContainerWithComments>
            <AppViewerCommentsSidebar />
            <AppViewerBodyContainer
              backgroundColor={selectedTheme.properties.colors.backgroundColor}
            >
              <AppViewerBody
                hasPages={pages.length > 1}
                headerHeight={headerHeight}
              >
                {isInitialized && registered && (
                  <Switch>
                    <SentryRoute
                      component={AppViewerPageContainer}
                      exact
                      path={VIEWER_URL}
                    />
                    <SentryRoute
                      component={AppViewerPageContainer}
                      exact
                      path={VIEWER_FORK_PATH}
                    />
                  </Switch>
                )}
              </AppViewerBody>
              <PoweredBy />
            </AppViewerBodyContainer>
          </ContainerWithComments>
          <AddCommentTourComponent />
          <CommentShowCaseCarousel />
        </EditorContext.Provider>
      </GlobalHotKeys>
    </ThemeProvider>
  );
}

export default withRouter(Sentry.withProfiler(AppViewer));
