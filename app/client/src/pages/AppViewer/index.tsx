import React, { Component } from "react";
import styled, { ThemeProvider } from "styled-components";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps, Route } from "react-router";
import { Switch } from "react-router-dom";
import { AppState } from "reducers";
import {
  AppViewerRouteParams,
  BuilderRouteParams,
  getApplicationViewerPageURL,
} from "constants/routes";
import {
  PageListPayload,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { getIsInitialized } from "selectors/appViewSelectors";
import { executeTrigger } from "actions/widgetActions";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { updateWidgetPropertyRequest } from "actions/controlActions";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppViewerPageContainer from "./AppViewerPageContainer";
import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "actions/metaActions";
import { editorInitializer } from "utils/EditorUtils";
import * as Sentry from "@sentry/react";
import { getViewModePageList } from "selectors/editorSelectors";
import AppComments from "comments/AppComments/AppComments";
import AddCommentTourComponent from "comments/tour/AddCommentTourComponent";
import CommentShowCaseCarousel from "comments/CommentsShowcaseCarousel";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "./GlobalHotKeys";

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

const ContainerWithComments = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

const AppViewerBodyContainer = styled.div<{ width?: string }>`
  flex: 1;
  overflow: auto;
  margin: 0 auto;
`;

export type AppViewerProps = {
  initializeAppViewer: (applicationId: string, pageId?: string) => void;
  isInitialized: boolean;
  isInitializeError: boolean;
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  updateWidgetProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  updateWidgetMetaProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  resetChildrenMetaProperty: (widgetId: string) => void;
  pages: PageListPayload;
  lightTheme: Theme;
} & RouteComponentProps<BuilderRouteParams>;

class AppViewer extends Component<
  AppViewerProps & RouteComponentProps<AppViewerRouteParams>
> {
  public state = {
    registered: false,
    isSideNavOpen: true,
  };
  componentDidMount() {
    editorInitializer().then(() => {
      this.setState({ registered: true });
    });
    const { applicationId, pageId } = this.props.match.params;
    if (applicationId) {
      this.props.initializeAppViewer(applicationId, pageId);
    }
  }

  toggleCollapse = (open: boolean) => {
    this.setState({ isSideNavOpen: open });
  };

  public render() {
    const { isInitialized } = this.props;
    return (
      <ThemeProvider theme={this.props.lightTheme}>
        <GlobalHotKeys>
          <EditorContext.Provider
            value={{
              executeAction: this.props.executeAction,
              updateWidgetMetaProperty: this.props.updateWidgetMetaProperty,
              resetChildrenMetaProperty: this.props.resetChildrenMetaProperty,
            }}
          >
            <ContainerWithComments>
              <AppComments isInline />
              <AppViewerBodyContainer>
                <AppViewerBody hasPages={this.props.pages.length > 1}>
                  {isInitialized && this.state.registered && (
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
            </ContainerWithComments>
            <AddCommentTourComponent />
            <CommentShowCaseCarousel />
          </EditorContext.Provider>
        </GlobalHotKeys>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isInitialized: getIsInitialized(state),
  pages: getViewModePageList(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

const mapDispatchToProps = (dispatch: any) => ({
  executeAction: (actionPayload: ExecuteTriggerPayload) =>
    dispatch(executeTrigger(actionPayload)),
  updateWidgetProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) =>
    dispatch(
      updateWidgetPropertyRequest(widgetId, propertyName, propertyValue),
    ),
  updateWidgetMetaProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) =>
    dispatch(updateWidgetMetaProperty(widgetId, propertyName, propertyValue)),
  resetChildrenMetaProperty: (widgetId: string) =>
    dispatch(resetChildrenMetaProperty(widgetId)),
  initializeAppViewer: (applicationId: string, pageId?: string) => {
    dispatch({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      payload: { applicationId, pageId },
    });
  },
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(AppViewer)),
);
