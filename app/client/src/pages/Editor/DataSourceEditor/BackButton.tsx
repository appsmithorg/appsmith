import React from "react";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";
import { useHistory } from "react-router-dom";

const Back = styled.span`
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
  /* background-color: ${(props) => props.theme.colors.apiPane.iconHoverBg}; */
`;

function BackButton() {
  const history = useHistory();
  return (
    <Back onClick={history.goBack}>
      <Icon icon="chevron-left" iconSize={16} />
      <Text style={{ color: "#0c0000", lineHeight: "14px" }} type={TextType.P1}>
        Back
      </Text>
    </Back>
  );
}

export default BackButton;
