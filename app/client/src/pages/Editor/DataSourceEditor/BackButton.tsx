import React from "react";
import styled from "styled-components";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { builderURL, generateTemplateFormURL } from "@appsmith/RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { Link } from "design-system";
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
  const pageId = useSelector(getCurrentPageId);
  const goBack = () => {
    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    const redirectURL = isGeneratePageInitiator
      ? generateTemplateFormURL({ pageId })
      : builderURL({ pageId });

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
