import React, { ReactNode } from "react";
import styled from "styled-components";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { Button, MenuItem, Intent as BlueprintIntent } from "@blueprintjs/core";
import { DropdownOption } from "widgets/DropdownWidget";
import { ControlIconName, ControlIcons } from "icons/ControlIcons";
import { noop } from "utils/AppsmithUtils";
import { Intent } from "constants/DefaultTheme";

export type ContextDropdownOption = DropdownOption & {
  onSelect: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  intent?: Intent;
};
const Dropdown = Select.ofType<ContextDropdownOption>();

const StyledMenuItem = styled(MenuItem)`
  &&&&.bp3-menu-item:hover {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.textOnDarkBG};
  }
  &&&.bp3-menu-item.bp3-intent-danger:hover {
    background: ${props => props.theme.colors.error};
  }
`;

type ContextDropdownProps = {
  options: ContextDropdownOption[];
  className: string;
  toggle: {
    type: "icon" | "button";
    icon?: ControlIconName;
    iconSize?: number;
    text?: string;
    placeholder?: string;
  };
};

export const ContextDropdown = (props: ContextDropdownProps) => {
  let trigger: ReactNode;
  if (props.toggle.type === "icon" && props.toggle.icon)
    trigger = ControlIcons[props.toggle.icon]({
      width: props.toggle.iconSize,
      height: props.toggle.iconSize,
    });
  if (props.toggle.type === "button" && props.toggle.text)
    trigger = <Button text={props.toggle.text} />;

  const renderer: ItemRenderer<ContextDropdownOption> = (
    option: ContextDropdownOption,
  ) => {
    return (
      <StyledMenuItem
        key={option.value}
        onClick={option.onSelect}
        shouldDismissPopover={true}
        text={option.label || option.value}
        intent={option.intent as BlueprintIntent}
        popoverProps={{
          minimal: true,
          hoverCloseDelay: 0,
          hoverOpenDelay: 0,
          modifiers: {
            arrow: {
              enabled: false,
            },
            offset: {
              enabled: true,
              offset: "-16px 0",
            },
          },
        }}
      />
    );
  };
  return (
    <Dropdown
      items={props.options}
      itemRenderer={renderer}
      onItemSelect={noop}
      filterable={false}
      className={props.className}
    >
      {trigger}
    </Dropdown>
  );
};

export default ContextDropdown;
