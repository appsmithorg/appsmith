import React, { Component } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { getIsFetchingPage } from "selectors/appViewSelectors";
import styled from "styled-components";
import { AppViewerRouteParams } from "constants/routes";
import { AppState } from "reducers";
import { theme } from "constants/DefaultTheme";
import { Icon, NonIdealState, Spinner } from "@blueprintjs/core";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import AppPage from "./AppPage";
import {
  getCanvasWidgetDsl,
  getCurrentApplicationId,
  getCurrentPageName,
  selectURLSlugs,
} from "selectors/editorSelectors";
import RequestConfirmationModal from "pages/Editor/RequestConfirmationModal";
import { getCurrentApplication } from "selectors/applicationSelectors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { fetchPublishedPage } from "actions/pageActions";
import { DSLWidget } from "widgets/constants";
import { builderURL } from "RouteBuilder";

const Section = styled.section`
  background: ${(props) => props.theme.colors.artboard};
  height: max-content;
  min-height: 100%;
  margin: 0 auto;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
`;
type AppViewerPageContainerProps = {
  isFetchingPage: boolean;
  widgets?: DSLWidget;
  currentPageName?: string;
  currentAppName?: string;
  fetchPage: (pageId: string, bustCache?: boolean) => void;
  currentAppPermissions?: string[];
  applicationId: string;
  applicationSlug: string;
  pageSlug: string;
} & RouteComponentProps<AppViewerRouteParams>;

class AppViewerPageContainer extends Component<AppViewerPageContainerProps> {
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
    let appsmithEditorLink;
    if (
      this.props.currentAppPermissions &&
      isPermitted(
        this.props.currentAppPermissions,
        PERMISSION_TYPE.MANAGE_APPLICATION,
      )
    ) {
      appsmithEditorLink = (
        <p>
          Please add widgets to this page in the&nbsp;
          <Link
            to={builderURL({
              applicationSlug: this.props.applicationSlug,
              pageSlug: this.props.pageSlug,
              pageId: this.props.match.params.pageId as string,
            })}
          >
            Appsmith Editor
          </Link>
        </p>
      );
    }
    const pageNotFound = (
      <Centered isInheritedHeight>
        <NonIdealState
          description={appsmithEditorLink}
          icon={
            <Icon
              color={theme.colors.primaryOld}
              icon="page-layout"
              iconSize={theme.fontSizes[9]}
            />
          }
          title="This page seems to be blank"
        />
      </Centered>
    );
    const pageLoading = (
      <Centered isInheritedHeight>
        <Spinner />
      </Centered>
    );
    if (this.props.isFetchingPage) {
      return pageLoading;
    } else if (!this.props.isFetchingPage && this.props.widgets) {
      return (
        <Section>
          {!(
            this.props.widgets.children &&
            this.props.widgets.children.length > 0
          ) && pageNotFound}
          <AppPage
            appName={this.props.currentAppName}
            dsl={this.props.widgets}
            pageId={this.props.match.params.pageId}
            pageName={this.props.currentPageName}
          />
          <RequestConfirmationModal />
        </Section>
      );
    }
  }
}

const mapStateToProps = (state: AppState) => {
  const currentApp = getCurrentApplication(state);
  const { applicationSlug, pageSlug } = selectURLSlugs(state);
  return {
    isFetchingPage: getIsFetchingPage(state),
    widgets: getCanvasWidgetDsl(state),
    currentPageName: getCurrentPageName(state),
    currentAppName: currentApp?.name,
    currentAppPermissions: currentApp?.userPermissions,
    applicationId: getCurrentApplicationId(state),
    applicationSlug,
    pageSlug,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  fetchPage: (pageId: string, bustCache = false) =>
    dispatch(fetchPublishedPage(pageId, bustCache)),
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AppViewerPageContainer),
);
