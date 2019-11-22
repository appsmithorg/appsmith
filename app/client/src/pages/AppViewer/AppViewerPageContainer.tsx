import React, { Component } from "react";
import { RouteComponentProps, Link } from "react-router-dom";
import { connect } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  getIsFetchingPage,
  getCurrentPageLayoutDSL,
} from "selectors/appViewSelectors";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import { AppViewerRouteParams } from "constants/routes";
import { AppState } from "reducers";
import { theme } from "constants/DefaultTheme";
import { NonIdealState, Icon, Spinner } from "@blueprintjs/core";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import AppPage from "./AppPage";

type AppViewerPageContainerProps = {
  isFetchingPage: boolean;
  dsl?: ContainerWidgetProps<WidgetProps>;
  fetchPage: (pageId: string) => void;
} & RouteComponentProps<AppViewerRouteParams>;

class AppViewerPageContainer extends Component<AppViewerPageContainerProps> {
  componentDidMount() {
    const { pageId } = this.props.match.params;
    if (pageId) {
      this.props.fetchPage(pageId);
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
              Please add widgets to this page in the
              <Link to="/builder"> Appsmith Editor</Link>
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
    } else if (!this.props.isFetchingPage && !this.props.dsl) {
      return pageNotFound;
    } else if (!this.props.isFetchingPage && this.props.dsl) {
      return <AppPage dsl={this.props.dsl} />;
    }
  }
}

const mapStateToProps = (state: AppState) => ({
  isFetchingPage: getIsFetchingPage(state),
  dsl: getCurrentPageLayoutDSL(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchPage: (pageId: string) =>
    dispatch({
      type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      payload: {
        pageId,
      },
    }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppViewerPageContainer);
