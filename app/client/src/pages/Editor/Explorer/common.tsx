import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Entity from "./Entity";
import { Button } from "design-system";

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

const ECAddButton = styled(Button)`
  margin-left: -4px;
`;

export function EmptyComponent(props: {
  mainText: string;
  addBtnText?: string;
  addFunction?: () => void;
}) {
  const showAddCta = props.addFunction && props.addBtnText;
  return (
    <ECContainer>
      <ECMainText>{props.mainText}</ECMainText>
      {showAddCta && (
        <ECAddButton
          kind="tertiary"
          onClick={props.addFunction}
          startIcon="plus"
        >
          {props.addBtnText && props.addBtnText}
        </ECAddButton>
      )}
    </ECContainer>
  );
}

export const AddEntity = styled(Entity)`
  color: ${Colors.CHARCOAL};

  .t--entity-name {
    color: ${Colors.CHARCOAL};
  }
`;
