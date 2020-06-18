import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import { Switch } from "react-router-dom";
import { AppState } from "reducers";
import {
  AppViewerRouteParams,
  BuilderRouteParams,
  getApplicationViewerPageURL,
} from "constants/routes";
import {
  ReduxActionTypes,
  PageListPayload,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import {
  getPageList,
  getCurrentDSLPageId,
  getIsInitialized,
  getEditorURL,
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
import AppRoute from "pages/common/AppRoute";
import { editorInitializer } from "utils/EditorUtils";
import { PERMISSION_TYPE } from "pages/Applications/permissionHelpers";

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
  currentApplication: ApplicationPayload | undefined;
  pages?: PageListPayload;
  initializeAppViewer: Function;
  isInitialized: boolean;
  editorURL: string;
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
  public state = {
    registered: false,
  };
  componentDidMount() {
    editorInitializer().then(() => {
      this.setState({ registered: true });
    });
    const { applicationId } = this.props.match.params;
    if (this.props.match.params.applicationId) {
      this.props.initializeAppViewer(applicationId);
    }
  }

  public render() {
    const { isInitialized, currentApplication } = this.props;
    const userPermissions = currentApplication?.userPermissions ?? [];
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
    if (!this.state.registered) return null;

    return (
      <EditorContext.Provider
        value={{
          executeAction: this.props.executeAction,
          updateWidgetMetaProperty: this.props.updateWidgetMetaProperty,
          resetChildrenMetaProperty: this.props.resetChildrenMetaProperty,
        }}
      >
        <AppViewWrapper>
          <AppViewerHeader
            url={this.props.editorURL}
            permissions={userPermissions || []}
            permissionRequired={PERMISSION_TYPE.MANAGE_APPLICATION}
          />
          <AppViewerBody>
            <AppViewerSideNavWrapper>
              <SideNav items={items} active={this.props.currentDSLPageId} />
            </AppViewerSideNavWrapper>
            <Switch>
              <AppRoute
                path={getApplicationViewerPageURL()}
                exact
                component={AppViewerPageContainer}
                name={"AppViewerPageContainer"}
                logDisable
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
  editorURL: getEditorURL(state),
  currentApplication: state.ui.applications.currentApplication,
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
