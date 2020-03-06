import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import { Switch, Route } from "react-router-dom";
import { AppState } from "reducers";
import {
  AppViewerRouteParams,
  BuilderRouteParams,
  getApplicationViewerPageURL,
} from "constants/routes";
import {
  ReduxActionTypes,
  PageListPayload,
} from "constants/ReduxActionConstants";
import {
  getPageList,
  getCurrentDSLPageId,
  getIsInitialized,
} from "selectors/appViewSelectors";
import { executeAction } from "actions/widgetActions";
import { ExecuteActionPayload } from "constants/ActionConstants";
import SideNav from "./viewer/SideNav";
import { SideNavItemProps } from "./viewer/SideNavItem";
import AppViewerHeader from "./viewer/AppViewerHeader";
import { updateWidgetPropertyRequest } from "actions/controlActions";
import { RenderModes } from "constants/WidgetConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppViewerPageContainer from "./AppViewerPageContainer";
import AppViewerSideNavWrapper from "./viewer/AppViewerSideNavWrapper";
import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "actions/metaActions";

const AppViewWrapper = styled.div`
  margin-top: ${props => props.theme.headerHeight};
  background: white;
`;
const AppViewerBody = styled.section`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  height: calc(100vh - ${props => props.theme.headerHeight});
`;

export type AppViewerProps = {
  currentDSLPageId?: string;
  currentLayoutId?: string;
  pages?: PageListPayload;
  initializeAppViewer: Function;
  isInitialized: boolean;
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
} & RouteComponentProps<BuilderRouteParams>;

class AppViewer extends Component<
  AppViewerProps & RouteComponentProps<AppViewerRouteParams>
> {
  componentDidMount() {
    const { applicationId } = this.props.match.params;
    if (this.props.match.params.applicationId) {
      this.props.initializeAppViewer(applicationId);
    }
  }

  public render() {
    const { isInitialized } = this.props;
    if (!isInitialized) return null;
    const items: SideNavItemProps[] | undefined =
      this.props.pages &&
      this.props.pages.map(page => ({
        text: page.pageName,
        id: page.pageId,
        icon: "page-layout", //TODO: get the icon from page.
        path: getApplicationViewerPageURL(
          this.props.match.params.applicationId,
          page.pageId,
        ),
        loading: false,
      }));

    return (
      <EditorContext.Provider
        value={{
          executeAction: this.props.executeAction,
          updateWidgetProperty: this.props.updateWidgetProperty,
          updateWidgetMetaProperty: this.props.updateWidgetMetaProperty,
          resetChildrenMetaProperty: this.props.resetChildrenMetaProperty,
        }}
      >
        <AppViewWrapper>
          <AppViewerHeader />
          <AppViewerBody>
            <AppViewerSideNavWrapper>
              <SideNav items={items} active={this.props.currentDSLPageId} />
            </AppViewerSideNavWrapper>
            <Switch>
              <Route
                path={getApplicationViewerPageURL()}
                exact
                component={AppViewerPageContainer}
              />
            </Switch>
          </AppViewerBody>
        </AppViewWrapper>
      </EditorContext.Provider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  currentDSLPageId: getCurrentDSLPageId(state),
  pages: getPageList(state),
  isInitialized: getIsInitialized(state),
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
  initializeAppViewer: (applicationId: string) =>
    dispatch({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      payload: { applicationId },
    }),
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AppViewer),
);
