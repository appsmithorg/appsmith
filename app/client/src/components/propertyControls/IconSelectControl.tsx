import * as React from "react";
import styled from "styled-components";

import { Alignment, Button, Classes, Menu, MenuItem } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { ItemListRenderer, ItemRenderer, Select } from "@blueprintjs/select";
import BaseControl, { ControlProps } from "./BaseControl";

const StyledButton = styled(Button)`
  box-shadow: none !important;
  border: none !important;
  background-color: #ffffff !important;

  > span.bp3-icon-caret-down {
    color: rgb(169, 167, 167);
  }
`;

const StyledMenu = styled(Menu)`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(50px, auto);
  gap: 15px;
  max-height: 200px;
`;

const StyledMenuItem = styled(MenuItem)`
  flex-direction: column;
  align-items: center;
  padding-top: 13px;
  padding-bottom: 13px;

  &:active,
  &:hover,
  &.bp3-active {
    background-color: #eeeeee !important;
  }

  > span.bp3-icon {
    margin-right: 0;
    color: #939090 !important;
  }
  > div {
    width: 100%;
    text-align: center;
  }
`;

export interface IconSelectControlProps extends ControlProps {
  propertyValue?: IconName;
}

const NONE = "(none)";
type IconType = IconName | typeof NONE;
const ICON_NAMES = Object.keys(IconNames).map<IconType>(
  (name: string) => IconNames[name as keyof typeof IconNames],
);
ICON_NAMES.push(NONE);

const TypedSelect = Select.ofType<IconType>();

class IconSelectControl extends BaseControl<IconSelectControlProps> {
  constructor(props: IconSelectControlProps) {
    super(props);
  }

  public render() {
    const { propertyValue: iconName } = this.props;
    return (
      <TypedSelect
        itemListRenderer={this.renderMenu}
        itemPredicate={this.filterIconName}
        itemRenderer={this.renderIconItem}
        items={ICON_NAMES}
        noResults={<MenuItem disabled text="No results" />}
        onItemSelect={this.handleIconChange}
        popoverProps={{ minimal: true }}
      >
        <StyledButton
          alignText={Alignment.LEFT}
          className={Classes.TEXT_OVERFLOW_ELLIPSIS}
          fill
          icon={iconName}
          rightIcon="caret-down"
          text={iconName || NONE}
        />
      </TypedSelect>
    );
  }

  private renderMenu: ItemListRenderer<IconType> = ({
    items,
    itemsParentRef,
    renderItem,
  }) => {
    const renderedItems = items.map(renderItem).filter((item) => item != null);

    return <StyledMenu ulRef={itemsParentRef}>{renderedItems}</StyledMenu>;
  };

  private renderIconItem: ItemRenderer<IconName | typeof NONE> = (
    icon,
    { handleClick, modifiers },
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <StyledMenuItem
        active={modifiers.active}
        icon={icon === NONE ? undefined : icon}
        key={icon}
        onClick={handleClick}
      />
    );
  };

  private filterIconName = (
    query: string,
    iconName: IconName | typeof NONE,
  ) => {
    if (iconName === NONE || query === "") {
      return true;
    }
    return iconName.toLowerCase().indexOf(query.toLowerCase()) >= 0;
  };

  private handleIconChange = (icon: IconType) =>
    this.updateProperty(
      this.props.propertyName,
      icon === NONE ? undefined : icon,
    );

  static getControlType() {
    return "ICON_SELECT";
  }
}

export default IconSelectControl;
