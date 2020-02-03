import React, { ReactNode } from "react";
import { withTheme } from "styled-components";
import {
  Popover,
  IconName,
  PopoverPosition,
  Classes,
  PopoverInteractionKind,
} from "@blueprintjs/core";
import { MenuIcons } from "icons/MenuIcons";
import { Intent } from "constants/DefaultTheme";
import { Direction, Directions } from "utils/helpers";
import { getDirectionBased } from "./dropdownHelpers";
import { Theme } from "constants/DefaultTheme";
import {
  Option,
  DropdownContentSection,
  DropdownContent,
  DropdownTrigger,
} from "./StyledComponents";
import Button, { ButtonProps } from "components/editorComponents/Button";

export type CustomizedDropdownOptionSection = {
  isSticky?: boolean;
  options?: CustomizedDropdownOption[];
};

export type CustomizedDropdownOption = {
  content: ReactNode;
  active?: boolean;
  onSelect?: () => void;
  intent?: Intent;
  shouldCloseDropdown?: boolean;
  disabled?: boolean;
};

export type CustomizedDropdownProps = {
  sections: CustomizedDropdownOptionSection[];
  trigger: ButtonProps & {
    content?: ReactNode;
    size?: "large" | "small";
  };
  openDirection: Direction;
  openOnHover?: boolean;
};

const getContentSection = (section: CustomizedDropdownOptionSection) => {
  return (
    <React.Fragment>
      {section.options &&
        section.options.map((option, index) => {
          const shouldClose =
            option.shouldCloseDropdown === undefined ||
            option.shouldCloseDropdown;
          return (
            <Option
              key={index}
              className={shouldClose ? Classes.POPOVER_DISMISS : ""}
              onClick={option.onSelect}
              active={!!option.active}
              disabled={!!option.disabled}
            >
              {option.content}
            </Option>
          );
        })}
    </React.Fragment>
  );
};

export const CustomizedDropdown = (
  props: CustomizedDropdownProps & { theme: Theme },
) => {
  const icon =
    props.trigger.icon &&
    MenuIcons[props.trigger.icon]({
      color: props.theme.colors.info,
      width: 16,
      height: 16,
    });
  const trigger = (
    <React.Fragment>
      {icon && <div>{icon}</div>}
      {props.trigger.content || (
        <Button
          outline={props.trigger.outline}
          filled={props.trigger.filled}
          size={props.trigger.size}
          icon={getDirectionBased.ICON_NAME(props.openDirection) as IconName}
          iconAlignment={Directions.RIGHT}
          text={props.trigger.text}
          intent={props.trigger.intent}
        />
      )}
    </React.Fragment>
  );
  const content = props.sections.map((section, index) => (
    <DropdownContentSection key={index} stick={!!section.isSticky}>
      {getContentSection(section)}
    </DropdownContentSection>
  ));
  return (
    <Popover
      position={
        getDirectionBased.POPPER_POSITION(
          props.openDirection,
        ) as PopoverPosition
      }
      interactionKind={
        props.openOnHover
          ? PopoverInteractionKind.HOVER
          : PopoverInteractionKind.CLICK
      }
      minimal
      enforceFocus={false}
    >
      <DropdownTrigger>{trigger}</DropdownTrigger>
      <DropdownContent>{content}</DropdownContent>
    </Popover>
  );
};

export default withTheme(CustomizedDropdown);
