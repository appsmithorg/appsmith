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
import EndTourHelper from "components/editorComponents/Onboarding/EndTourHelper";
import ConfirmRunModal from "pages/Editor/ConfirmRunModal";
import { getCurrentApplication } from "selectors/applicationSelectors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { fetchPublishedPage } from "actions/pageActions";

const Section = styled.section`
  height: max-content;
  min-height: 100%;
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

  if (isFetchingPage) {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  return (
    <Section>
      {!(widgets.children && widgets?.children.length > 0) && (
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
      )}
      <AppPage
        appName={currentApplication?.name}
        dsl={widgets}
        pageId={match.params.pageId}
        pageName={currentPageName}
      />
      <ConfirmRunModal />
      <EndTourHelper />
    </Section>
  );
}

export default AppViewerPageContainer;
