import React, { useState } from "react";

import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { IconName } from "@blueprintjs/icons";
import { ButtonVariant } from "components/constants";
import { BaseCellComponentProps } from "../Constants";
import { CellWrapper, IconButtonWrapper } from "../TableStyledWrappers";
import { StyledButton } from "widgets/IconButtonWidget/component";

interface RenderIconButtonProps extends BaseCellComponentProps {
  isSelected: boolean;
  columnActions?: ColumnAction[];
  iconName?: IconName;
  buttonVariant: ButtonVariant;
  buttonColor: string;
  borderRadius: string;
  boxShadow: string;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  disabled: boolean;
}

function IconButton(props: {
  iconName?: IconName;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  isSelected: boolean;
  action: ColumnAction;
  buttonColor: string;
  buttonVariant: ButtonVariant;
  borderRadius: string;
  boxShadow: string;
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
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
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
        buttonColor={props.buttonColor}
        buttonVariant={props.buttonVariant}
        disabled={props.disabled}
        icon={props.iconName}
        loading={loading}
        onClick={handleClick}
      />
    </IconButtonWrapper>
  );
}

export function IconButtonCell(props: RenderIconButtonProps) {
  const {
    allowCellWrapping,
    borderRadius,
    boxShadow,
    buttonColor,
    buttonVariant,
    cellBackground,
    columnActions,
    compactMode,
    disabled,
    fontStyle,
    horizontalAlignment,
    iconName,
    isCellVisible,
    isHidden,
    isSelected,
    onCommandClick,
    textColor,
    textSize,
    verticalAlignment,
  } = props;

  if (!columnActions)
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      />
    );

  return (
    <CellWrapper
      allowCellWrapping={allowCellWrapping}
      cellBackground={cellBackground}
      compactMode={compactMode}
      fontStyle={fontStyle}
      horizontalAlignment={horizontalAlignment}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      textColor={textColor}
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      {columnActions.map((action: ColumnAction, index: number) => {
        return (
          <IconButton
            action={action}
            borderRadius={borderRadius}
            boxShadow={boxShadow}
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
