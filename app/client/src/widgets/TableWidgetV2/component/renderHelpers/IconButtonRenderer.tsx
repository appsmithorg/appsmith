import React, { useState } from "react";

import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { IconName } from "@blueprintjs/icons";
import {
  ButtonVariant,
  ButtonBoxShadow,
  ButtonBorderRadius,
} from "components/constants";
import { CellLayoutProperties } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import { StyledButton } from "widgets/IconButtonWidget/component";

interface RenderIconButtonProps {
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
    <div onClick={handlePropagation}>
      <StyledButton
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
        boxShadowColor={props.boxShadowColor}
        buttonColor={props.buttonColor}
        buttonVariant={props.buttonVariant}
        disabled={props.disabled}
        icon={props.iconName}
        loading={loading}
        onClick={handleClick}
      />
    </div>
  );
}

export const renderIconButton = (
  props: RenderIconButtonProps,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
) => {
  if (!props.columnActions)
    return <CellWrapper cellProperties={cellProperties} isHidden={isHidden} />;

  return (
    <CellWrapper
      cellProperties={cellProperties}
      isCellVisible={props.isCellVisible}
      isHidden={isHidden}
    >
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <IconButton
            action={action}
            borderRadius={props.borderRadius}
            boxShadow={props.boxShadow}
            boxShadowColor={props.boxShadowColor}
            buttonColor={props.buttonColor}
            buttonVariant={props.buttonVariant}
            disabled={props.disabled}
            iconName={props.iconName}
            isSelected={props.isSelected}
            key={index}
            onCommandClick={props.onCommandClick}
          />
        );
      })}
    </CellWrapper>
  );
};
