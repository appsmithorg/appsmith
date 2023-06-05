import React from "react";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { INTEGRATION_TABS } from "constants/routes";
import { getQueryParams } from "utils/URLUtils";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import {
  builderURL,
  generateTemplateFormURL,
  integrationEditorURL,
} from "RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Link } from "design-system";
import styled from "styled-components";
import type { AppsmithLocationState } from "../../utils/history";
import { NavigationMethod } from "../../utils/history";
import { useHistory, useLocation } from "react-router-dom";
import {
  getSelectedTab,
  isCanvasCodeActive,
} from "selectors/canvasCodeSelectors";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";

const StyledLink = styled(Link)`
  margin: var(--ads-v2-spaces-7) 0 0 var(--ads-v2-spaces-7);
  width: fit-content;
`;

function useShowCloseButton() {
  const canvasCodeActive = useSelector(isCanvasCodeActive);
  const location = useLocation();

  if (canvasCodeActive) {
    if (
      identifyEntityFromPath(location.pathname).entity !==
      FocusEntity.DATASOURCE
    )
      return false;
  }

  return true;
}

function CloseEditor() {
  const history = useHistory<AppsmithLocationState>();
  const params: string = location.search;
  const searchParamsInstance = new URLSearchParams(params);
  const redirectTo = searchParamsInstance.get("from");
  const pageId = useSelector(getCurrentPageId);
  const canvasCodeActive = useSelector(isCanvasCodeActive);
  const canvasCodeTab = useSelector(getSelectedTab);
  const showCloseButton = useShowCloseButton();
  const dispatch = useDispatch();

  const isGeneratePageInitiator = getIsGeneratePageInitiator();
  let integrationTab = INTEGRATION_TABS.ACTIVE;

  if (isGeneratePageInitiator) {
    // When users routes to Integrations page via generate CRUD page form
    // the INTEGRATION_TABS.ACTIVE is hidden and
    // hence when routing back, user should go back to INTEGRATION_TABS.NEW tab.
    integrationTab = INTEGRATION_TABS.NEW;
  }

  const handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: location.pathname },
    );

    // if it is a generate CRUD page flow from which user came here
    // then route user back to `/generate-page/form`
    // else go back to BUILDER_PAGE
    const redirectURL = isGeneratePageInitiator
      ? generateTemplateFormURL({ pageId })
      : builderURL({ pageId });

    const URL =
      redirectTo === "datasources"
        ? integrationEditorURL({
            pageId,
            selectedTab: integrationTab,
            params: getQueryParams(),
          })
        : redirectURL;
    e.preventDefault();
    AnalyticsUtil.logEvent("BACK_BUTTON_CLICK", {
      type: "BACK_BUTTON",
      fromUrl: location.pathname,
      toUrl: URL,
    });

    if (
      canvasCodeActive &&
      URL !== builderURL({ pageId }) &&
      canvasCodeTab !== "CANVAS"
    ) {
      dispatch({
        type: "NAVIGATE_MOST_RECENT",
      });
      return;
    }

    history.push(URL, { invokedBy: NavigationMethod.ActionBackButton });
  };

  if (!showCloseButton) return null;

  return (
    <StyledLink
      className="t--close-editor"
      kind="secondary"
      onClick={handleClose}
      startIcon="arrow-left-line"
      target="_self"
    >
      Back
    </StyledLink>
  );
}

export default CloseEditor;
