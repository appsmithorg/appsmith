import React, { Component } from "react";
import { RouteComponentProps, Link } from "react-router-dom";
import { connect } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getIsFetchingPage } from "selectors/appViewSelectors";
import styled from "styled-components";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import { AppViewerRouteParams, BUILDER_PAGE_URL } from "constants/routes";
import { AppState } from "reducers";
import { theme } from "constants/DefaultTheme";
import { NonIdealState, Icon, Spinner } from "@blueprintjs/core";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import AppPage from "./AppPage";
import {
  getCanvasWidgetDsl,
  getCurrentPageName,
} from "selectors/editorSelectors";

const Section = styled.section`
  background: ${props => props.theme.colors.bodyBG};
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
`;
type AppViewerPageContainerProps = {
  isFetchingPage: boolean;
  widgets?: ContainerWidgetProps<WidgetProps>;
  currentPageName?: string;
  fetchPage: (pageId: string, bustCache?: boolean) => void;
} & RouteComponentProps<AppViewerRouteParams>;

class AppViewerPageContainer extends Component<AppViewerPageContainerProps> {
  componentDidMount() {
    const { pageId } = this.props.match.params;
    if (pageId) {
      this.props.fetchPage(pageId, true);
    }
  }
  componentDidUpdate(previously: AppViewerPageContainerProps) {
    const { pageId } = this.props.match.params;
    if (
      pageId &&
      previously.location.pathname !== this.props.location.pathname
    ) {
      this.props.fetchPage(pageId);
    }
  }
  render() {
    const pageNotFound = (
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
              Please add widgets to this page in the&nbsp;
              <Link
                to={BUILDER_PAGE_URL(
                  this.props.match.params.applicationId,
                  this.props.match.params.pageId,
                )}
              >
                Appsmith Editor
              </Link>
            </p>
          }
        />
      </Centered>
    );
    const pageLoading = (
      <Centered>
        <Spinner />
      </Centered>
    );
    if (this.props.isFetchingPage) {
      return pageLoading;
    } else if (
      !this.props.isFetchingPage &&
      !(
        this.props.widgets &&
        this.props.widgets.children &&
        this.props.widgets.children.length > 0
      )
    ) {
      return pageNotFound;
    } else if (!this.props.isFetchingPage && this.props.widgets) {
      return (
        <Section>
          <AppPage
            dsl={this.props.widgets}
            pageId={this.props.match.params.pageId}
            pageName={this.props.currentPageName}
          />
        </Section>
      );
    }
  }
}

const mapStateToProps = (state: AppState) => ({
  isFetchingPage: getIsFetchingPage(state),
  widgets: getCanvasWidgetDsl(state),
  currentPageName: getCurrentPageName(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchPage: (pageId: string, bustCache = false) =>
    dispatch({
      type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      payload: {
        pageId,
        bustCache,
      },
    }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppViewerPageContainer);
