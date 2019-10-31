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
  getCurrentPageId,
  getCurrentPageLayoutDSL,
  getPageList,
} from "../../selectors/appViewSelectors";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { WidgetProps } from "../../widgets/BaseWidget";
import { executeAction } from "../../actions/widgetActions";
import { ActionPayload } from "../../constants/ActionConstants";
import AppPage from "./AppPage";
import SideNav, { SideNavItem } from "../../components/viewer/SideNav";
import AppViewerHeader from "../../components/viewer/AppViewerHeader";

const AppViewWrapper = styled.div`
  margin-top: ${props => props.theme.headerHeight};
  background: white;
`;
const AppViewerBody = styled.section`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
`;
export type AppViewerProps = {
  currentPageId?: string;
  currentLayoutId?: string;
  executeAction: Function;
  fetchPageWidgets: Function;
  pages?: PageListPayload;
  dsl?: ContainerWidgetProps<WidgetProps>;
  initializeAppViewer: Function;
  match: any;
  location: any;
  history: any;
};

class AppViewer extends Component<AppViewerProps> {
  handlePageSelect = (item: SideNavItem) => {
    this.props.fetchPageWidgets(item.id);
  };

  componentDidMount() {
    this.props.initializeAppViewer(this.props.currentPageId);
  }

  public render() {
    const items: SideNavItem[] | undefined =
      this.props.pages &&
      this.props.pages.map(page => ({
        text: page.pageName,
        id: page.pageId,
      }));

    const currentPage =
      this.props.pages &&
      this.props.pages.find(page => page.pageId === this.props.currentPageId);
    return (
      <AppViewWrapper>
        <AppViewerHeader />
        <AppViewerBody>
          {items && (
            <SideNav
              items={items}
              onSelect={this.handlePageSelect}
              active={
                currentPage && {
                  text: currentPage.pageName,
                  id: currentPage.pageId,
                }
              }
            />
          )}
          {this.props.dsl && <AppPage dsl={this.props.dsl} />}
        </AppViewerBody>
      </AppViewWrapper>
    );
  }
}

const mapStateToProps = (state: AppState, props: AppViewerProps) => ({
  currentPageId: getCurrentPageId(state, props),
  dsl: getCurrentPageLayoutDSL(state),
  pages: getPageList(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  executeAction: (actionPayloads?: ActionPayload[]) =>
    dispatch(executeAction(actionPayloads)),
  fetchPageWidgets: (pageId: string) =>
    dispatch({
      type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      payload: {
        pageId,
      },
    }),
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
