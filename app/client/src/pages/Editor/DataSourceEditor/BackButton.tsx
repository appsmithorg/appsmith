import React from "react";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";
import { useHistory } from "react-router-dom";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { Colors } from "constants/Colors";
import { builderURL, generateTemplateFormURL } from "RouteBuilder";

const Back = styled.span`
  height: 30px;
  display: flex;
  gap: 4px;
  align-items: center;
  cursor: pointer;
  padding: ${(props) => props.theme.spaces[7]}px
    ${(props) => props.theme.spaces[11]}px 0px
    ${(props) => props.theme.spaces[11]}px;
  width: fit-content;
`;

function BackButton() {
  const history = useHistory();
  const goBack = () => {
    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    const redirectURL = isGeneratePageInitiator
      ? generateTemplateFormURL()
      : builderURL();
    history.push(redirectURL);
  };
  return (
    <Back className="t--back-button" onClick={goBack}>
      <Icon icon="chevron-left" iconSize={14} />
      <Text
        style={{ color: Colors.DIESEL, lineHeight: "14px" }}
        type={TextType.P3}
      >
        Back
      </Text>
    </Back>
  );
}

export default BackButton;
