import React, { Component } from "react";
import { RouteComponentProps, Link } from "react-router-dom";
import { connect } from "react-redux";
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
import EndTourHelper from "components/editorComponents/Onboarding/EndTourHelper";
import ConfirmRunModal from "pages/Editor/ConfirmRunModal";
import { getCurrentApplication } from "selectors/applicationSelectors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { fetchPublishedPage } from "actions/pageActions";

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
  widgets?: ContainerWidgetProps<WidgetProps>;
  currentPageName?: string;
  currentAppName?: string;
  fetchPage: (pageId: string, bustCache?: boolean) => void;
  currentAppPermissions?: string[];
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
            to={BUILDER_PAGE_URL(
              this.props.match.params.applicationId,
              this.props.match.params.pageId,
            )}
          >
            Appsmith Editor
          </Link>
        </p>
      );
    }
    const pageNotFound = (
      <Centered>
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
            appName={this.props.currentAppName}
            dsl={this.props.widgets}
            pageId={this.props.match.params.pageId}
            pageName={this.props.currentPageName}
          />
          <ConfirmRunModal />
          <EndTourHelper />
        </Section>
      );
    }
  }
}

const mapStateToProps = (state: AppState) => {
  const currentApp = getCurrentApplication(state);
  const props = {
    isFetchingPage: getIsFetchingPage(state),
    widgets: getCanvasWidgetDsl(state),
    currentPageName: getCurrentPageName(state),
    currentAppName: currentApp?.name,
    currentAppPermissions: currentApp?.userPermissions,
  };
  return props;
};

const mapDispatchToProps = (dispatch: any) => ({
  fetchPage: (pageId: string, bustCache = false) =>
    dispatch(fetchPublishedPage(pageId, bustCache)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppViewerPageContainer);
