import React from "react";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";

const BackText = styled.span`
  font-size: 16px;
  font-weight: 500;
`;

const Back = styled.span`
  cursor: pointer;
`;

function BackButton(props: { onClick: () => void }) {
  return (
    <Back onClick={props.onClick}>
      <Icon icon="chevron-left" iconSize={16} />
      <BackText>Back</BackText>
    </Back>
  );
}

export default BackButton;
