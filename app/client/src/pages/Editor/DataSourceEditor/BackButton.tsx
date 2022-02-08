import React from "react";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { Colors } from "constants/Colors";
import {
  getCurrentPageId,
  selectRelevantSlugNames,
} from "../../../selectors/editorSelectors";
import {
  BUILDER_PAGE_URL,
  getGenerateTemplateFormURL,
} from "../../../constants/routes";

const Back = styled.span`
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
`;

function BackButton() {
  const history = useHistory();
  const pageId = useSelector(getCurrentPageId) as string;
  const { applicationSlug, pageSlug } = useSelector(selectRelevantSlugNames);
  const goBack = () => {
    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    const redirectURL = isGeneratePageInitiator
      ? getGenerateTemplateFormURL(applicationSlug, pageSlug, pageId)
      : BUILDER_PAGE_URL({ applicationSlug, pageSlug, pageId });
    history.push(redirectURL);
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
