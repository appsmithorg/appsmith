import * as React from "react";

import { Alignment, Button, Classes, Menu, MenuItem } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { ItemListRenderer, ItemRenderer, Select } from "@blueprintjs/select";
import BaseControl, { ControlProps } from "./BaseControl";
// import Icon, { IconCollection, IconName } from "components/ads/Icon";

export interface IconSelectControlProps extends ControlProps {
  propertyValue?: IconName;
}

const NONE = "(none)";
type IconType = IconName | typeof NONE;
const ICON_NAMES = Object.keys(IconNames).map<IconType>(
  (name: string) => IconNames[name as keyof typeof IconNames],
);
ICON_NAMES.push(NONE);
// const ICON_NAMES: IconType[] = [NONE, ...IconCollection];

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
        <Button
          alignText={Alignment.LEFT}
          className={Classes.TEXT_OVERFLOW_ELLIPSIS}
          fill
          icon={iconName}
          // icon={<Icon name={iconName} />}
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

    return (
      <Menu
        css={`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        `}
        ulRef={itemsParentRef}
      >
        {renderedItems}
      </Menu>
    );
  };

  private renderIconItem: ItemRenderer<IconName | typeof NONE> = (
    icon,
    { handleClick, modifiers },
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={modifiers.active}
        css={`
          flex-direction: column;
          align-items: center;
          > span.bp3-icon {
            margin-right: 0;
          }
          > div {
            width: 100%;
            text-align: center;
          }
        `}
        icon={icon === NONE ? undefined : icon}
        key={icon}
        onClick={handleClick}
        text={icon}
      />
      // <Icon
      //   key={icon}
      //   name={icon === NONE ? undefined : icon}
      //   onClick={handleClick}
      // />
    );
  };

  private filterIconName = (
    query: string,
    iconName: IconName | typeof NONE,
  ) => {
    if (iconName === NONE || query === "") {
      return true;
    }
    // if (query === "") {
    //   return iconName === this.props.propertyValue;
    // }
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
