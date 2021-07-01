import React from "react";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";

const Back = styled.span`
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
  /* background-color: ${(props) => props.theme.colors.apiPane.iconHoverBg}; */
`;

function BackButton(props: { onClick: () => void }) {
  return (
    <Back onClick={props.onClick}>
      <Icon icon="chevron-left" iconSize={16} />
      <Text style={{ color: "#0c0000", lineHeight: "14px" }} type={TextType.P1}>
        Back
      </Text>
    </Back>
  );
}

export default BackButton;
