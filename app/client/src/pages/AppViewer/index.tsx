import React, { Component } from "react";
import styled, { ThemeProvider } from "styled-components";
import { connect } from "react-redux";
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
import {
  PageListPayload,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { getIsInitialized } from "selectors/appViewSelectors";
import { executeTrigger } from "actions/widgetActions";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import {
  BatchPropertyUpdatePayload,
  batchUpdateWidgetProperty,
  updateWidgetPropertyRequest,
} from "actions/controlActions";
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
import { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "./GlobalHotKeys";

import { getSearchQuery } from "utils/helpers";
import AppViewerCommentsSidebar from "./AppViewerComemntsSidebar";
import { showPostCompletionMessage } from "selectors/onboardingSelectors";

const SentryRoute = Sentry.withSentryRouting(Route);

const AppViewerBody = styled.section<{
  hasPages: boolean;
  showGuidedTourMessage: boolean;
  isEmbeded: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  height: ${(props) => {
    // embeded page will not have top header
    if (props.isEmbeded) return "100vh;";

    let offsetHeight = "";

    if (!props.hasPages) {
      offsetHeight = `${props.theme.smallHeaderHeight} - 1px`;
    } else {
      offsetHeight = "72px";
    }

    if (props.showGuidedTourMessage) {
      offsetHeight += " - 100px";
    }

    return `calc(100vh - ${offsetHeight});`;
  }};
`;

const ContainerWithComments = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  background: ${(props) => props.theme.colors.artboard};
`;

const AppViewerBodyContainer = styled.div<{ width?: string }>`
  flex: 1;
  overflow: auto;
  margin: 0 auto;
`;

export type AppViewerProps = {
  initializeAppViewer: (params: {
    applicationId: string;
    pageId?: string;
    branch?: string;
  }) => void;
  isInitialized: boolean;
  showGuidedTourMessage: boolean;
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
  batchUpdateWidgetProperty: (
    widgetId: string,
    updates: BatchPropertyUpdatePayload,
  ) => void;
} & RouteComponentProps<BuilderRouteParams>;

type Props = AppViewerProps & RouteComponentProps<AppViewerRouteParams>;

class AppViewer extends Component<Props> {
  public state = {
    registered: false,
    isSideNavOpen: true,
  };
  componentDidMount() {
    editorInitializer().then(() => {
      this.setState({ registered: true });
    });

    const { applicationId, pageId } = this.props.match.params;
    const {
      location: { search },
    } = this.props;
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

    if (applicationId) {
      this.props.initializeAppViewer({
        branch: branch,
        applicationId,
        pageId,
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { applicationId, pageId } = this.props.match.params;
    const {
      location: { search: prevSearch },
    } = prevProps;
    const {
      location: { search },
    } = this.props;

    const prevBranch = getSearchQuery(prevSearch, GIT_BRANCH_QUERY_KEY);
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

    if (branch && branch !== prevBranch && applicationId && pageId) {
      this.props.initializeAppViewer({
        applicationId,
        pageId,
        branch: branch,
      });
    }
  }

  toggleCollapse = (open: boolean) => {
    this.setState({ isSideNavOpen: open });
  };

  public render() {
    const { isInitialized, location } = this.props;
    const isEmbeded = location.search.indexOf("embed=true") !== -1;
    return (
      <ThemeProvider theme={this.props.lightTheme}>
        <GlobalHotKeys>
          <EditorContext.Provider
            value={{
              executeAction: this.props.executeAction,
              updateWidgetMetaProperty: this.props.updateWidgetMetaProperty,
              resetChildrenMetaProperty: this.props.resetChildrenMetaProperty,
              batchUpdateWidgetProperty: this.props.batchUpdateWidgetProperty,
            }}
          >
            <ContainerWithComments>
              <AppViewerCommentsSidebar />
              <AppViewerBodyContainer>
                <AppViewerBody
                  hasPages={this.props.pages.length > 1}
                  isEmbeded={isEmbeded}
                  showGuidedTourMessage={this.props.showGuidedTourMessage}
                >
                  {isInitialized && this.state.registered && (
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
  showGuidedTourMessage: showPostCompletionMessage(state),
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
  initializeAppViewer: (params: {
    applicationId: string;
    pageId?: string;
    branch?: string;
  }) => {
    dispatch({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      payload: params,
    });
  },
  batchUpdateWidgetProperty: (
    widgetId: string,
    updates: BatchPropertyUpdatePayload,
  ) => dispatch(batchUpdateWidgetProperty(widgetId, updates)),
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(AppViewer)),
);
