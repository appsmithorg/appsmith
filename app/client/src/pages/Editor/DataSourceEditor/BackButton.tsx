import React from "react";
import styled from "styled-components";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { builderURL, generateTemplateFormURL } from "ee/RouteBuilder";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { Link } from "@appsmith/ads";
import type { AppsmithLocationState } from "utils/history";
import { NavigationMethod } from "utils/history";
import { useHistory } from "react-router-dom";

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
