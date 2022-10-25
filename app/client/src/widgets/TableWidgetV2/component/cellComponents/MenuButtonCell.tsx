import React from "react";
import { IconName } from "@blueprintjs/icons";
import { Alignment } from "@blueprintjs/core";

import { BaseCellComponentProps, MenuItems } from "../Constants";
import { ButtonVariant } from "components/constants";
import { CellWrapper } from "../TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import MenuButtonTableComponent from "./menuButtonTableComponent";
import { MenuItemsSource } from "widgets/MenuButtonWidget/constants";

interface MenuButtonProps extends Omit<RenderMenuButtonProps, "columnActions"> {
  action?: ColumnAction;
}

function MenuButton({
  borderRadius,
  boxShadow,
  compactMode,
  configureMenuItems,
  iconAlign,
  iconName,
  isCompact,
  isDisabled,
  isSelected,
  label,
  menuColor,
  menuDropDownWidth,
  menuItems,
  menuItemsSource,
  menuVariant,
  onCommandClick,
  rowIndex,
  sourceData,
  width,
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
        compactMode={compactMode}
        configureMenuItems={configureMenuItems}
        iconAlign={iconAlign}
        iconName={iconName}
        isCompact={isCompact}
        isDisabled={isDisabled}
        label={label}
        menuColor={menuColor}
        menuDropDownWidth={menuDropDownWidth}
        menuItems={{ ...menuItems }}
        menuItemsSource={menuItemsSource}
        menuVariant={menuVariant}
        onItemClicked={onItemClicked}
        rowIndex={rowIndex}
        sourceData={sourceData}
        width={width}
      />
    </div>
  );
}

export interface RenderMenuButtonProps extends BaseCellComponentProps {
  isSelected: boolean;
  label: string;
  isDisabled: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete?: () => void) => void;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  rowIndex: number;
  configureMenuItems: {
    label: string;
    id: string;
    config: {
      id: string;
      label: any;
      isVisible: any;
      isDisabled: any;
      onClick?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
    };
  };
  menuDropDownWidth: number;
  menuItemsSource: MenuItemsSource;
  sourceData?: Array<Record<string, unknown>>;
  width: number;
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
      <MenuButton {...props} iconName={props.iconName} />
    </CellWrapper>
  );
}
