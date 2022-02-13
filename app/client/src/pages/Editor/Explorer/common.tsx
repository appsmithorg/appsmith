import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Icon from "components/ads/Icon";

const ECContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
`;

const ECMainText = styled.span`
  display: block;
  margin-bottom: 12px;
  font-size: 10px;
  color: ${Colors.DOVE_GRAY2};
`;

const ECAddButton = styled.div`
  display: flex;
  font-size: 11px;
  color: ${Colors.CHARCOAL};
  font-weight: 600;
  padding: 4px;
  margin-left: -4px;
  cursor: pointer;

  svg {
    margin-right: 4px;
  }
`;

export function EmptyComponent(props: {
  mainText: string;
  addBtnText: string;
  addFunction: () => void;
}) {
  return (
    <ECContainer>
      <ECMainText>{props.mainText}</ECMainText>
      <ECAddButton onClick={props.addFunction}>
        <Icon fillColor={Colors.CHARCOAL} name="plus" />
        {props.addBtnText}
      </ECAddButton>
    </ECContainer>
  );
}
