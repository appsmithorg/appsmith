import React from "react";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { Text, TextType } from "design-system-old";
import { useHistory } from "react-router-dom";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { Colors } from "constants/Colors";
import { builderURL, generateTemplateFormURL } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { AppsmithLocationState } from "utils/history";
import { NavigationMethod } from "utils/history";

const Back = styled.span`
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
  };
  return (
    <Back className="t--back-button" onClick={goBack}>
      <Icon icon="chevron-left" iconSize={16} />
      <Text
        style={{ color: Colors.DIESEL, lineHeight: "14px" }}
        type={TextType.P1}
      >
        Back
      </Text>
    </Back>
  );
}

export default BackButton;
