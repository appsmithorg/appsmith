import React from "react";
import type { IconName } from "@blueprintjs/icons";
import type { Alignment } from "@blueprintjs/core";

import type { BaseCellComponentProps } from "../Constants";
import type { ButtonVariant } from "components/constants";
import { CellWrapper } from "../TableStyledWrappers";
import type { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import MenuButtonTableComponent from "./menuButtonTableComponent";
import type {
  ConfigureMenuItems,
  MenuItem,
  MenuItems,
  MenuItemsSource,
} from "widgets/MenuButtonWidget/constants";

interface MenuButtonProps extends Omit<RenderMenuButtonProps, "columnActions"> {
  action?: ColumnAction;
}

function MenuButton({
  borderRadius,
  boxShadow,
  compactMode,
  configureMenuItems,
  getVisibleItems,
  iconAlign,
  iconName,
  isCompact,
  isDisabled,
  isSelected,
  label,
  menuColor,
  menuItems,
  menuItemsSource,
  menuVariant,
  onCommandClick,
  rowIndex,
  sourceData,
}: MenuButtonProps): JSX.Element {
  const handlePropagation = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (isSelected) {
      e.stopPropagation();
    }
  };
  const onItemClicked = (onClick?: string, index?: number) => {
    if (onClick) {
      onCommandClick(onClick, index);
    }
  };

  return (
    <div onClick={handlePropagation}>
      <MenuButtonTableComponent
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        compactMode={compactMode}
        configureMenuItems={configureMenuItems}
        getVisibleItems={getVisibleItems}
        iconAlign={iconAlign}
        iconName={iconName}
        isCompact={isCompact}
        isDisabled={isDisabled}
        label={label}
        menuColor={menuColor}
        menuItems={{ ...menuItems }}
        menuItemsSource={menuItemsSource}
        menuVariant={menuVariant}
        onItemClicked={onItemClicked}
        rowIndex={rowIndex}
        sourceData={sourceData}
      />
    </div>
  );
}

export interface RenderMenuButtonProps extends BaseCellComponentProps {
  isSelected: boolean;
  label: string;
  isDisabled: boolean;
  onCommandClick: (
    dynamicTrigger: string,
    index?: number,
    onComplete?: () => void,
  ) => void;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  rowIndex: number;
  getVisibleItems: (rowIndex: number) => Array<MenuItem>;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
}

export function MenuButtonCell(props: RenderMenuButtonProps) {
  const {
    allowCellWrapping,
    cellBackground,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellDisabled,
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
      isCellDisabled={isCellDisabled}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      textColor={textColor}
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      <MenuButton {...props} iconName={props.iconName} />
    </CellWrapper>
  );
}
