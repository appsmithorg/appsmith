import * as React from "react";

import { Alignment, Button, Classes, MenuItem } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { ItemRenderer, Select } from "@blueprintjs/select";
import BaseControl, { ControlProps } from "./BaseControl";

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

export class IconSelectControl extends BaseControl<IconSelectControlProps> {
  constructor(props: IconSelectControlProps) {
    super(props);
  }

  public render() {
    const { propertyValue: iconName } = this.props;
    return (
      <TypedSelect
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
          rightIcon="caret-down"
          text={iconName || NONE}
        />
      </TypedSelect>
    );
  }

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
        icon={icon === NONE ? undefined : icon}
        key={icon}
        onClick={handleClick}
        text={icon}
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
