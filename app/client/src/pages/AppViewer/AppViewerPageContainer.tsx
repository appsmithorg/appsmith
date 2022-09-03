import React, { useMemo } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { useSelector } from "react-redux";
import { getIsFetchingPage } from "selectors/appViewSelectors";
import styled from "styled-components";
import { AppViewerRouteParams } from "constants/routes";
import { theme } from "constants/DefaultTheme";
import { Icon, NonIdealState, Spinner } from "@blueprintjs/core";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import AppPage from "./AppPage";
import { getCanvasWidth, getCurrentPageName } from "selectors/editorSelectors";
import RequestConfirmationModal from "pages/Editor/RequestConfirmationModal";
import { getCurrentApplication } from "selectors/applicationSelectors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { builderURL } from "RouteBuilder";
import { getCanvasWidgetsStructure } from "selectors/entitiesSelector";
import equal from "fast-deep-equal/es6";

const Section = styled.section`
  height: 100%;
  width: 100%;
  margin: 0 auto;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
`;

type AppViewerPageContainerProps = RouteComponentProps<AppViewerRouteParams>;

function AppViewerPageContainer(props: AppViewerPageContainerProps) {
  const currentPageName = useSelector(getCurrentPageName);
  const widgetsStructure = useSelector(getCanvasWidgetsStructure, equal);
  const canvasWidth = useSelector(getCanvasWidth);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const currentApplication = useSelector(getCurrentApplication);
  const { match } = props;

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
            to={builderURL({
              pageId: props.match.params.pageId as string,
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

  if (!(widgetsStructure.children && widgetsStructure.children.length > 0))
    return pageNotFound;

  return (
    <Section>
      <AppPage
        appName={currentApplication?.name}
        canvasWidth={canvasWidth}
        pageId={match.params.pageId}
        pageName={currentPageName}
        widgetsStructure={widgetsStructure}
      />
      <RequestConfirmationModal />
    </Section>
  );
}

export default withRouter(AppViewerPageContainer);
