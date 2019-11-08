import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { AppState } from "../../reducers";
import {
  ReduxActionTypes,
  PageListPayload,
} from "../../constants/ReduxActionConstants";
import {
  getCurrentRoutePageId,
  getCurrentPageLayoutDSL,
  getPageList,
  getIsFetchingPage,
  getCurrentDSLPageId,
} from "../../selectors/appViewSelectors";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { WidgetProps } from "../../widgets/BaseWidget";
import { executeAction } from "../../actions/widgetActions";
import { ActionPayload } from "../../constants/ActionConstants";
import AppPage from "./AppPage";
import { Spinner, NonIdealState, Icon } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { theme } from "../../constants/DefaultTheme";
import SideNav, { SideNavItem } from "./viewer/SideNav";
import AppViewerHeader from "./viewer/AppViewerHeader";
import { updateWidgetProperty } from "../../actions/controlActions";
import { RenderModes } from "../../constants/WidgetConstants";
import { WidgetFunctionsContext } from "../Editor/WidgetsEditor";

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
const Centered = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const SideNavWrapper = styled.div`
  background: ${props => props.theme.colors.paneBG};
  & button.sidenav-toggle,
  & button.sidenav-toggle:hover,
  & button.sidenav-toggle:active {
    background: ${props => props.theme.colors.paneBG};
    outline: none;
    border: none;
    border-radius: 0;
  }
  & ul {
    background: ${props => props.theme.colors.paneBG};
    color: ${props => props.theme.colors.textOnDarkBG};
    padding: 0;
    height: 100%;
    width: 100%;
    & li {
      padding: 0;
    }
    & li div.bp3-menu-item {
      width: 100%;
      font-size: ${props => props.theme.fontSizes[3]}px;
      &.bp3-intent-primary {
        background: ${props => props.theme.sideNav.activeItemBGColor};
      }
      & div {
        line-height: ${props => props.theme.lineHeights[6]}px;
      }
    }
  }
`;

export type AppViewerProps = {
  currentRoutePageId?: string;
  currentDSLPageId?: string;
  currentLayoutId?: string;
  fetchPageWidgets: Function;
  pages?: PageListPayload;
  dsl?: ContainerWidgetProps<WidgetProps>;
  initializeAppViewer: Function;
  isFetching: boolean;
  match: any;
  location: any;
  history: any;
  executeAction: (actionPayloads?: ActionPayload[]) => void;
  updateWidgetProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
};

class AppViewer extends Component<AppViewerProps> {
  handlePageSelect = (item: SideNavItem) => {
    this.props.fetchPageWidgets(item.id);
    this.props.history.push(`/view/pages/${item.id}`);
  };

  componentDidMount() {
    this.props.initializeAppViewer(this.props.currentRoutePageId);
  }

  componentDidUpdate(prevProps: AppViewerProps) {
    if (
      prevProps.currentRoutePageId !== this.props.currentRoutePageId &&
      this.props.currentDSLPageId !== this.props.currentRoutePageId
    ) {
      this.props.fetchPageWidgets(this.props.currentRoutePageId);
    }
  }

  public render() {
    const items: SideNavItem[] | undefined =
      this.props.pages &&
      this.props.pages.map(page => ({
        text: page.pageName,
        id: page.pageId,
        icon: "page-layout", //TODO: get the icon from page.
      }));

    const currentPage =
      this.props.pages &&
      this.props.pages.find(
        page => page.pageId === this.props.currentRoutePageId,
      );
    return (
      <WidgetFunctionsContext.Provider
        value={{
          executeAction: this.props.executeAction,
          updateWidgetProperty: this.props.updateWidgetProperty,
        }}
      >
        <AppViewWrapper>
          <AppViewerHeader />
          <AppViewerBody>
            {items && (
              <SideNavWrapper>
                <SideNav
                  items={items}
                  onSelect={this.handlePageSelect}
                  iconSize={24}
                  active={
                    currentPage && {
                      text: currentPage.pageName,
                      id: currentPage.pageId,
                    }
                  }
                />
              </SideNavWrapper>
            )}
            {this.props.isFetching && (
              <Centered>
                <Spinner />
              </Centered>
            )}
            {!this.props.isFetching && !this.props.dsl && items && (
              <Centered>
                <NonIdealState
                  icon={
                    <Icon
                      iconSize={theme.fontSizes[9]}
                      icon="page-layout"
                      color={theme.colors.primary}
                    />
                  }
                  title="This page seems to be blank"
                  description={
                    <p>
                      Please add widgets to this page in the
                      <Link to="/builder"> Appsmith Editor</Link>
                    </p>
                  }
                />
              </Centered>
            )}
            {this.props.dsl && <AppPage dsl={this.props.dsl} />}
          </AppViewerBody>
        </AppViewWrapper>
      </WidgetFunctionsContext.Provider>
    );
  }
}

const mapStateToProps = (state: AppState, props: AppViewerProps) => ({
  currentRoutePageId: getCurrentRoutePageId(state, props),
  currentDSLPageId: getCurrentDSLPageId(state),
  dsl: getCurrentPageLayoutDSL(state),
  pages: getPageList(state),
  isFetching: getIsFetchingPage(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  executeAction: (actionPayloads?: ActionPayload[]) =>
    dispatch(executeAction(actionPayloads)),
  updateWidgetProperty: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) =>
    dispatch(
      updateWidgetProperty(
        widgetId,
        propertyName,
        propertyValue,
        RenderModes.PAGE,
      ),
    ),
  fetchPageWidgets: (pageId: string) => {
    dispatch({
      type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      payload: {
        pageId,
      },
    });
  },
  initializeAppViewer: (pageId: string) =>
    dispatch({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      payload: { pageId },
    }),
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(AppViewer),
);
