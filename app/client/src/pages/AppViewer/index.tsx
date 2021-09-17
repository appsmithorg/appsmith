import React, { useEffect, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Route, useParams } from "react-router";
import { Switch } from "react-router-dom";
import { AppState } from "reducers";
import {
  BuilderRouteParams,
  getApplicationViewerPageURL,
} from "constants/routes";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "actions/metaActions";
import { getIsInitialized } from "selectors/appViewSelectors";
import { executeTrigger } from "actions/widgetActions";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppViewerPageContainer from "./AppViewerPageContainer";
import { editorInitializer } from "utils/EditorUtils";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import { getViewModePageList } from "selectors/editorSelectors";
import AddCommentTourComponent from "comments/tour/AddCommentTourComponent";
import CommentShowCaseCarousel from "comments/CommentsShowcaseCarousel";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import GlobalHotKeys from "./GlobalHotKeys";
import AppViewerCommentsSidebar from "./AppViewerComemntsSidebar";

const SentryRoute = Sentry.withSentryRouting(Route);

const AppViewerBody = styled.section<{ hasPages: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  height: calc(
    100vh -
      ${(props) => (!props.hasPages ? props.theme.smallHeaderHeight : "72px")}
  );
`;

const AppViewerBodyContainer = styled.div<{ width?: string }>`
  flex: 1;
  overflow: auto;
  margin: 0 auto;
`;

function AppViewer() {
  const dispatch = useDispatch();
  const { applicationId, pageId } = useParams<BuilderRouteParams>();
  const [registered, setRegistered] = useState(false);
  const pages = useSelector(getViewModePageList);
  const lightTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.DARK),
  );
  const isInitialized = useSelector(getIsInitialized);

  /**
   * callback for execute action
   */
  const executeActionCb = (actionPayload: ExecuteTriggerPayload) => {
    dispatch(executeTrigger(actionPayload));
  };

  /**
   * update widget meta property
   *
   * @param widgetId
   * @param propertyName
   * @param propertyValue
   */
  const updateWidgetMetaPropertyCb = (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => {
    dispatch(updateWidgetMetaProperty(widgetId, propertyName, propertyValue));
  };

  /**
   * reset children meta property
   *
   * @param widgetId
   * @returns
   */
  const resetChildrenMetaPropertyCb = (widgetId: string) => {
    dispatch(resetChildrenMetaProperty(widgetId));
  };

  /**
   * initializer app viewer
   *
   * @param applicationId
   * @param pageId
   * @returns
   */
  const initializeAppViewer = (applicationId: string, pageId?: string) => {
    dispatch({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      payload: { applicationId, pageId },
    });
  };

  /**
   *
   */
  useEffect(() => {
    editorInitializer().then(() => {
      setRegistered(true);
    });
    if (applicationId) {
      initializeAppViewer(applicationId, pageId);
    }
  }, [applicationId, pageId]);

  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalHotKeys>
        <EditorContext.Provider
          value={{
            executeAction: executeActionCb,
            updateWidgetMetaProperty: updateWidgetMetaPropertyCb,
            resetChildrenMetaProperty: resetChildrenMetaPropertyCb,
          }}
        >
          <div className="flex items-stretch">
            <AppViewerCommentsSidebar />
            <AppViewerBodyContainer>
              <AppViewerBody hasPages={pages.length > 1}>
                {isInitialized && registered && (
                  <Switch>
                    <SentryRoute
                      component={AppViewerPageContainer}
                      exact
                      path={getApplicationViewerPageURL()}
                    />
                    <SentryRoute
                      component={AppViewerPageContainer}
                      exact
                      path={`${getApplicationViewerPageURL()}/fork`}
                    />
                  </Switch>
                )}
              </AppViewerBody>
            </AppViewerBodyContainer>
          </div>
          <AddCommentTourComponent />
          <CommentShowCaseCarousel />
        </EditorContext.Provider>
      </GlobalHotKeys>
    </ThemeProvider>
  );
}

export default Sentry.withProfiler(AppViewer);
