import React, { useState } from "react";

import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { IconName } from "@blueprintjs/icons";
import {
  ButtonVariant,
  ButtonBoxShadow,
  ButtonBorderRadius,
} from "components/constants";
import {
  CellAlignment,
  CellLayoutProperties,
  VerticalAlignment,
} from "../Constants";
import { CellWrapper, IconButtonWrapper } from "../TableStyledWrappers";
import { StyledButton } from "widgets/IconButtonWidget/component";

interface RenderIconButtonProps {
  compactMode: string;
  isSelected: boolean;
  columnActions?: ColumnAction[];
  iconName?: IconName;
  buttonVariant: ButtonVariant;
  buttonColor: string;
  borderRadius: ButtonBorderRadius;
  boxShadow: ButtonBoxShadow;
  boxShadowColor: string;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  isCellVisible: boolean;
  disabled: boolean;
  isHidden: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
}

function IconButton(props: {
  iconName?: IconName;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  isSelected: boolean;
  action: ColumnAction;
  buttonColor: string;
  buttonVariant: ButtonVariant;
  borderRadius: ButtonBorderRadius;
  boxShadow: ButtonBoxShadow;
  boxShadowColor: string;
  disabled: boolean;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };
  const handlePropagation = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (props.isSelected) {
      e.stopPropagation();
    }
  };
  const handleClick = () => {
    if (props.action.dynamicTrigger) {
      setLoading(true);
      props.onCommandClick(props.action.dynamicTrigger, onComplete);
    }
  };
  return (
    <IconButtonWrapper disabled={props.disabled} onClick={handlePropagation}>
      <StyledButton
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
        boxShadowColor={props.boxShadowColor}
        buttonColor={props.buttonColor}
        buttonVariant={props.buttonVariant}
        disabled={props.disabled}
        icon={props.iconName}
        loading={loading}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          handleClick();
        }}
      />
    </IconButtonWrapper>
  );
}

export function IconButtonCell(props: RenderIconButtonProps) {
  const {
    allowCellWrapping,
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonColor,
    buttonVariant,
    columnActions,
    compactMode,
    disabled,
    horizontalAlignment,
    iconName,
    isCellVisible,
    isHidden,
    isSelected,
    onCommandClick,
    verticalAlignment,
  } = props;

  if (!columnActions)
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        horizontalAlignment={horizontalAlignment}
        isHidden={isHidden}
        verticalAlignment={verticalAlignment}
      />
    );

  return (
    <CellWrapper
      allowCellWrapping={allowCellWrapping}
      compactMode={compactMode}
      horizontalAlignment={horizontalAlignment}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      verticalAlignment={verticalAlignment}
    >
      {columnActions.map((action: ColumnAction, index: number) => {
        return (
          <IconButton
            action={action}
            borderRadius={borderRadius}
            boxShadow={boxShadow}
            boxShadowColor={boxShadowColor}
            buttonColor={buttonColor}
            buttonVariant={buttonVariant}
            disabled={disabled}
            iconName={iconName}
            isSelected={isSelected}
            key={index}
            onCommandClick={onCommandClick}
          />
        );
      })}
    </CellWrapper>
  );
}
