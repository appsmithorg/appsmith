import React, { ReactNode } from "react";
import { withTheme } from "styled-components";
import {
  Popover,
  IconName,
  PopoverPosition,
  Classes,
  PopoverInteractionKind,
  Icon,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { MenuIcons } from "icons/MenuIcons";
import { Intent, IntentColors } from "constants/DefaultTheme";
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
  usePortal?: boolean;
  themeType?: string;
};

const getIcon = (icon?: string, intent?: Intent) => {
  if (icon) {
    if (MenuIcons[icon]) {
      return MenuIcons[icon]({
        color: IntentColors[intent || "secondary"],
        width: 16,
        height: 16,
      });
    }
    const iconNames = Object.values({ ...IconNames });
    if (iconNames.indexOf(icon as IconName) > -1) {
      return (
        <Icon
          icon={icon as IconName}
          iconSize={16}
          color={intent ? IntentColors[intent] : IntentColors["secondary"]}
        />
      );
    }
  }
};

const getContentSection = (
  section: CustomizedDropdownOptionSection,
  themeType: string,
) => {
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
              themeType={themeType}
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
  const themeType = props.themeType ? props.themeType : "light";
  const icon = getIcon(props.trigger.icon, props.trigger.intent);
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
          themeType={props.themeType}
          type="button"
        />
      )}
    </React.Fragment>
  );

  const content = props.sections.map((section, index) => (
    <DropdownContentSection
      key={index}
      stick={!!section.isSticky}
      themeType={themeType}
    >
      {getContentSection(section, themeType)}
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
      <DropdownTrigger themeType={themeType}>{trigger}</DropdownTrigger>
      <DropdownContent themeType={themeType}>{content}</DropdownContent>
    </Popover>
  );
};

export default withTheme(CustomizedDropdown);
