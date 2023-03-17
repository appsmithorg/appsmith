import React, { ReactNode } from "react";
import styled from "styled-components";
import { ItemRenderer, Select } from "@blueprintjs/select";
import {
  Button,
  MenuItem,
  Intent as BlueprintIntent,
  PopoverPosition,
  PopoverInteractionKind,
} from "@blueprintjs/core";
import { ControlIconName, ControlIcons } from "icons/ControlIcons";
import { noop } from "utils/AppsmithUtils";
import { Intent } from "constants/DefaultTheme";
import { IconProps } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { DropdownOption } from "components/constants";

export type ContextDropdownOption = DropdownOption & {
  onSelect: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  intent?: Intent;
  children?: ContextDropdownOption[];
};
const Dropdown = Select.ofType<ContextDropdownOption>();

const StyledMenuItem = styled(MenuItem)`
  &&&&.bp3-menu-item:hover {
    background: ${(props) => props.theme.colors.primaryOld};
    color: ${(props) => props.theme.colors.textOnDarkBG};
  }
  &&&.bp3-menu-item.bp3-intent-danger:hover {
    background: ${(props) => props.theme.colors.error};
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
    color?: string;
  };
};

function DropdownItem(option: ContextDropdownOption) {
  return (
    <StyledMenuItem
      intent={option.intent as BlueprintIntent}
      key={option.value}
      onClick={option.onSelect}
      popoverProps={{
        minimal: true,
        hoverCloseDelay: 0,
        hoverOpenDelay: 300,
        interactionKind: PopoverInteractionKind.CLICK,
        position: PopoverPosition.RIGHT,
        modifiers: {
          arrow: {
            enabled: false,
          },
          offset: {
            enabled: true,
            offset: "-16px, 0",
          },
        },
      }}
      shouldDismissPopover
      text={option.label || option.value}
    >
      {option.children && option.children.map(DropdownItem)}
    </StyledMenuItem>
  );
}

export function ContextDropdown(props: ContextDropdownProps) {
  let trigger: ReactNode;
  if (props.toggle.type === "icon" && props.toggle.icon) {
    const TriggerElement = ControlIcons[props.toggle.icon];
    const TriggerElementProps: IconProps = {
      width: props.toggle.iconSize,
      height: props.toggle.iconSize,
      color: props.toggle.color || Colors.SLATE_GRAY,
    };
    trigger = <TriggerElement {...TriggerElementProps} />;
  }
  if (props.toggle.type === "button" && props.toggle.text)
    trigger = <Button text={props.toggle.text} />;

  const renderer: ItemRenderer<ContextDropdownOption> = (
    option: ContextDropdownOption,
  ) => <DropdownItem key={option.value} {...option} />;

  return (
    <Dropdown
      className={props.className}
      filterable={false}
      itemRenderer={renderer}
      items={props.options}
      onItemSelect={noop}
    >
      {trigger}
    </Dropdown>
  );
}

export default ContextDropdown;
