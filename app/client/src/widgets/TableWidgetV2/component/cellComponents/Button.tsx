import React, { useState } from "react";

import { ActionWrapper } from "../TableStyledWrappers";
import { BaseButton } from "widgets/ButtonWidget/component";
import { ButtonColumnActions } from "widgets/TableWidgetV2/constants";
import styled from "styled-components";

const StyledButton = styled(BaseButton)`
  min-width: 40px;
`;

type ButtonProps = {
  isCellVisible: boolean;
  isSelected: boolean;
  isDisabled?: boolean;
  action: ButtonColumnActions;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
};

export function Button(props: ButtonProps) {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };
  const handleClick = () => {
    setLoading(true);
    props.onCommandClick(props.action.dynamicTrigger, onComplete);
  };

  return (
    <ActionWrapper
      disabled={!!props.isDisabled}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {props.isCellVisible && props.action.isVisible ? (
        <StyledButton
          borderRadius={props.action.borderRadius}
          boxShadow={props.action.boxShadow}
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
