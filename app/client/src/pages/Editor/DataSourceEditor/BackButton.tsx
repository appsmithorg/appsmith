import React from "react";
import styled from "styled-components";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { builderURL, generateTemplateFormURL } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { Link } from "design-system";
import { NavigationMethod } from "utils/history";

const Back = styled(Link)`
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-left: 16px;
`;

function BackButton() {
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
    return `${redirectURL}?invokedBy=${NavigationMethod.ActionBackButton}`;
  };

  return (
    <Back
      className="t--back-button"
      startIcon="arrow-left-line"
      target="_self"
      to={goBack()}
    >
      Back
    </Back>
  );
}

export default BackButton;
