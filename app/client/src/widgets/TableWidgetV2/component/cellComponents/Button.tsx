import React, { useState } from "react";

import { ActionWrapper } from "../TableStyledWrappers";
import { BaseButton } from "widgets/ButtonWidget/component";
import {
  ColumnTypes,
  type ButtonColumnActions,
} from "widgets/TableWidgetV2/constants";
import styled from "styled-components";
import AutoToolTipComponent from "widgets/TableWidgetV2/component/cellComponents/AutoToolTipComponent";

const StyledButton = styled(BaseButton)<{
  compactMode?: string;
}>`
  min-width: 40px;

  min-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "22px" : "27px"};
  font-size: ${({ compactMode }) =>
    compactMode === "SHORT" ? "12px" : "14px"};
  line-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "28px"};
`;

interface ButtonProps {
  isCellVisible: boolean;
  isSelected: boolean;
  isDisabled?: boolean;
  action: ButtonColumnActions;
  compactMode?: string;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}

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
      {props.isCellVisible && props.action.isVisible
        ? props.action.label && (
            <AutoToolTipComponent
              columnType={ColumnTypes.BUTTON}
              title={props.action.label}
            >
              <StyledButton
                borderRadius={props.action.borderRadius}
                boxShadow={props.action.boxShadow}
                buttonColor={props.action.backgroundColor}
                buttonVariant={props.action.variant}
                compactMode={props.compactMode}
                disabled={props.isDisabled}
                iconAlign={props.action.iconAlign}
                iconName={props.action.iconName}
                loading={loading}
                onClick={handleClick}
                text={props.action.label}
              />
            </AutoToolTipComponent>
          )
        : null}
    </ActionWrapper>
  );
}
