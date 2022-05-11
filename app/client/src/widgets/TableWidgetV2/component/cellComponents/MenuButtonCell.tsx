import React from "react";
import { IconName } from "@blueprintjs/icons";
import { Alignment } from "@blueprintjs/core";

import { CellAlignment, MenuItems, VerticalAlignment } from "../Constants";
import { ButtonVariant } from "components/constants";
import { CellWrapper } from "../TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import MenuButtonTableComponent from "./menuButtonTableComponent";

interface MenuButtonProps extends Omit<RenderMenuButtonProps, "columnActions"> {
  action?: ColumnAction;
}

function MenuButton({
  borderRadius,
  boxShadow,
  iconAlign,
  iconName,
  isCompact,
  isDisabled,
  isSelected,
  label,
  menuColor,
  menuItems,
  menuVariant,
  onCommandClick,
}: MenuButtonProps): JSX.Element {
  const handlePropagation = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (isSelected) {
      e.stopPropagation();
    }
  };
  const onItemClicked = (onClick?: string) => {
    if (onClick) {
      onCommandClick(onClick);
    }
  };

  return (
    <div onClick={handlePropagation}>
      <MenuButtonTableComponent
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        iconAlign={iconAlign}
        iconName={iconName}
        isCompact={isCompact}
        isDisabled={isDisabled}
        label={label}
        menuColor={menuColor}
        menuItems={{ ...menuItems }}
        menuVariant={menuVariant}
        onItemClicked={onItemClicked}
      />
    </div>
  );
}

export interface RenderMenuButtonProps {
  compactMode: string;
  isSelected: boolean;
  label: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete?: () => void) => void;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  isHidden: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  fontStyle?: string;
  textColor?: string;
  cellBackground?: string;
  textSize?: string;
}

export function MenuButtonCell(props: RenderMenuButtonProps) {
  const {
    allowCellWrapping,
    cellBackground,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellVisible,
    isHidden,
    textColor,
    textSize,
    verticalAlignment,
  } = props;

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
      <MenuButton {...props} />
    </CellWrapper>
  );
}
