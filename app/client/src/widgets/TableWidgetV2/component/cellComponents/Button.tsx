import React, { useState } from "react";

import { ActionWrapper } from "../TableStyledWrappers";
import { BaseButton } from "widgets/ButtonWidget/component";
import { EditColumnActions } from "../renderHelpers/EditActionsRenderer";
import styled from "styled-components";

const StyledButton = styled(BaseButton)`
  min-width: 40px;
`;

export function Button(props: {
  isCellVisible: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  action: EditColumnActions;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}) {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };
  const handleClick = () => {
    if (props.action.dynamicTrigger) {
      setLoading(true);
      props.onCommandClick(props.action.dynamicTrigger, onComplete);
    }
  };

  return (
    <ActionWrapper
      onClick={(e) => {
        if (props.isSelected) {
          e.stopPropagation();
        }
      }}
    >
      {props.isCellVisible && props.action.isVisible ? (
        <StyledButton
          borderRadius={props.action.borderRadius}
          buttonColor={props.action.backgroundColor}
          buttonVariant={props.action.variant}
          disabled={props.isDisabled}
          iconAlign={props.action.iconAlign}
          iconName={props.action.iconName}
          loading={loading}
          onClick={handleClick}
          text={props.action.label}
        />
      ) : null}
    </ActionWrapper>
  );
}
