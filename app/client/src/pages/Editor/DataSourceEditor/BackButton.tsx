import React from "react";

import { builderURL, generateTemplateFormURL } from "ee/RouteBuilder";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import styled from "styled-components";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import type { AppsmithLocationState } from "utils/history";
import { NavigationMethod } from "utils/history";

import { Link } from "@appsmith/ads";

const Back = styled(Link)`
  display: flex;
  align-items: center;
  margin: var(--ads-v2-spaces-7) 0 0 var(--ads-v2-spaces-7);
`;

function BackButton() {
  const history = useHistory<AppsmithLocationState>();
  const basePageId = useSelector(getCurrentBasePageId);
  const goBack = () => {
    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    const redirectURL = isGeneratePageInitiator
      ? generateTemplateFormURL({ basePageId })
      : builderURL({ basePageId });

    AnalyticsUtil.logEvent("BACK_BUTTON_CLICK", {
      type: "BACK_BUTTON",
      fromUrl: location.pathname,
      toUrl: redirectURL,
    });
    history.push(redirectURL, { invokedBy: NavigationMethod.ActionBackButton });
  };

  return (
    <Back
      className="t--back-button"
      onClick={goBack}
      startIcon="arrow-left-line"
    >
      Back
    </Back>
  );
}

export default BackButton;
