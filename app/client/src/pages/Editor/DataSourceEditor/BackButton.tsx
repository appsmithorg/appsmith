import React from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { builderURL, generateTemplateFormURL } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { AppsmithLocationState } from "utils/history";
import { NavigationMethod } from "utils/history";
import { Link } from "design-system";

const Back = styled(Link)`
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
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
    return redirectURL;
  };

  return (
    <Back className="t--back-button" startIcon="left-arrow-2" to={goBack()}>
      Back
    </Back>
  );
}

export default BackButton;
