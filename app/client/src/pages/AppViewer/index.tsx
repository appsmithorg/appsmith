import React, { Component } from "react";
import styled from "styled-components";
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
import { executeAction } from "actions/widgetActions";
import { ExecuteActionPayload } from "constants/ActionConstants";
import { updateWidgetPropertyRequest } from "actions/controlActions";
import { RenderModes } from "constants/WidgetConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppViewerPageContainer from "./AppViewerPageContainer";
import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "actions/metaActions";
import { editorInitializer } from "utils/EditorUtils";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import { getViewModePageList } from "selectors/editorSelectors";

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

export type AppViewerProps = {
  initializeAppViewer: (applicationId: string, pageId?: string) => void;
  isInitialized: boolean;
  isInitializeError: boolean;
  executeAction: (actionPayload: ExecuteActionPayload) => void;
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
    log.debug({ applicationId, pageId });
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
      <EditorContext.Provider
        value={{
          executeAction: this.props.executeAction,
          updateWidgetMetaProperty: this.props.updateWidgetMetaProperty,
          resetChildrenMetaProperty: this.props.resetChildrenMetaProperty,
        }}
      >
        <AppViewerBody hasPages={this.props.pages.length > 1}>
          {isInitialized && this.state.registered && (
            <Switch>
              <SentryRoute
                path={getApplicationViewerPageURL()}
                exact
                component={AppViewerPageContainer}
              />
              <SentryRoute
                path={`${getApplicationViewerPageURL()}/fork`}
                component={AppViewerPageContainer}
                exact
              />
            </Switch>
          )}
        </AppViewerBody>
      </EditorContext.Provider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isInitialized: getIsInitialized(state),
  pages: getViewModePageList(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  executeAction: (actionPayload: ExecuteActionPayload) =>
    dispatch(executeAction(actionPayload)),
  updateWidgetProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) =>
    dispatch(
      updateWidgetPropertyRequest(
        widgetId,
        propertyName,
        propertyValue,
        RenderModes.PAGE,
      ),
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
