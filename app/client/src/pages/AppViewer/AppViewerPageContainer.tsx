import React, { useEffect, useMemo } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getIsFetchingPage } from "selectors/appViewSelectors";
import styled from "styled-components";
import { AppViewerRouteParams, BUILDER_PAGE_URL } from "constants/routes";
import { theme } from "constants/DefaultTheme";
import { Icon, NonIdealState, Spinner } from "@blueprintjs/core";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import AppPage from "./AppPage";
import {
  getCanvasWidgetDsl,
  getCurrentPageName,
} from "selectors/editorSelectors";
import RequestConfirmationModal from "pages/Editor/RequestConfirmationModal";
import { getCurrentApplication } from "selectors/applicationSelectors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { fetchPublishedPage } from "actions/pageActions";

const Section = styled.section<{
  height: number;
}>`
  height: 100%;
  min-height: ${({ height }) => height}px;
  margin: 0 auto;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
`;

type AppViewerPageContainerProps = RouteComponentProps<AppViewerRouteParams>;

function AppViewerPageContainer(props: AppViewerPageContainerProps) {
  const dispatch = useDispatch();
  const currentPageName = useSelector(getCurrentPageName);
  const widgets = useSelector(getCanvasWidgetDsl);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const currentApplication = useSelector(getCurrentApplication);
  const { match } = props;
  const { pageId } = match.params;

  useEffect(() => {
    pageId && dispatch(fetchPublishedPage(pageId));
  }, [pageId, location.pathname]);

  // get appsmith editr link
  const appsmithEditorLink = useMemo(() => {
    if (
      currentApplication?.userPermissions &&
      isPermitted(
        currentApplication?.userPermissions,
        PERMISSION_TYPE.MANAGE_APPLICATION,
      )
    ) {
      return (
        <p>
          Please add widgets to this page in the&nbsp;
          <Link
            to={BUILDER_PAGE_URL({
              applicationId: currentApplication.applicationId,
              pageId: match.params.pageId,
            })}
          >
            Appsmith Editor
          </Link>
        </p>
      );
    }
  }, [currentApplication?.userPermissions]);

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

  if (isFetchingPage) return pageLoading;

  return (
    <Section height={widgets.bottomRow}>
      {!(widgets.children && widgets.children.length > 0) && pageNotFound}
      <AppPage
        appName={currentApplication?.name}
        dsl={widgets}
        pageId={match.params.pageId}
        pageName={currentPageName}
      />
      <RequestConfirmationModal />
    </Section>
  );
}

export default AppViewerPageContainer;
