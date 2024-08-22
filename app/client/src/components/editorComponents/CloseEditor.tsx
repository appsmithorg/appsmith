import React from "react";

import { INTEGRATION_TABS } from "constants/routes";
import {
  generateTemplateFormURL,
  integrationEditorURL,
  widgetListURL,
} from "ee/RouteBuilder";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import styled from "styled-components";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getQueryParams } from "utils/URLUtils";

import { Link } from "@appsmith/ads";

import type { AppsmithLocationState } from "../../utils/history";
import { NavigationMethod } from "../../utils/history";

const StyledLink = styled(Link)`
  margin: var(--ads-v2-spaces-7) 0 0 var(--ads-v2-spaces-7);
  width: fit-content;
`;

function CloseEditor() {
  const history = useHistory<AppsmithLocationState>();
  const params: string = location.search;
  const searchParamsInstance = new URLSearchParams(params);
  const redirectTo = searchParamsInstance.get("from");
  const basePageId = useSelector(getCurrentBasePageId);

  const isGeneratePageInitiator = getIsGeneratePageInitiator();
  let integrationTab = INTEGRATION_TABS.ACTIVE;

  if (isGeneratePageInitiator) {
    // When users routes to Integrations page via generate CRUD page form
    // the INTEGRATION_TABS.ACTIVE is hidden and
    // hence when routing back, user should go back to INTEGRATION_TABS.NEW tab.
    integrationTab = INTEGRATION_TABS.NEW;
  }

  const handleClose = () => {
    // if it is a generate CRUD page flow from which user came here
    // then route user back to `/generate-page/form`
    // else go back to BUILDER_PAGE
    const redirectURL = isGeneratePageInitiator
      ? generateTemplateFormURL({ basePageId })
      : widgetListURL({ basePageId });

    const URL =
      redirectTo === "datasources"
        ? integrationEditorURL({
            basePageId,
            selectedTab: integrationTab,
            params: getQueryParams(),
          })
        : redirectURL;
    AnalyticsUtil.logEvent("BACK_BUTTON_CLICK", {
      type: "BACK_BUTTON",
      fromUrl: location.pathname,
      toUrl: URL,
    });
    history.push(URL, { invokedBy: NavigationMethod.ActionBackButton });
  };

  return (
    <StyledLink
      className="t--close-editor"
      kind="secondary"
      onClick={handleClose}
      startIcon="arrow-left-line"
    >
      Back
    </StyledLink>
  );
}

export default CloseEditor;
