import React from "react";
import { IconName } from "@blueprintjs/icons";
import { Alignment } from "@blueprintjs/core";

import { CellLayoutProperties, MenuItems } from "../Constants";
import {
  ButtonVariant,
  ButtonBoxShadow,
  ButtonBorderRadius,
} from "components/constants";
import { CellWrapper } from "../TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import MenuButtonTableComponent from "../cellComponents/menuButtonTableComponent";

interface MenuButtonProps extends Omit<RenderMenuButtonProps, "columnActions"> {
  action?: ColumnAction;
}

function MenuButton({
  borderRadius,
  boxShadow,
  boxShadowColor,
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
        boxShadowColor={boxShadowColor}
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
  // columnActions?: ColumnAction[];
  label: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete?: () => void) => void;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
}

export const renderMenuButton = (
  props: RenderMenuButtonProps,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
) => {
  return (
    <CellWrapper
      cellProperties={cellProperties}
      compactMode={props.compactMode}
      isCellVisible={props.isCellVisible}
      isHidden={isHidden}
    >
      <MenuButton {...props} />
    </CellWrapper>
  );
};
