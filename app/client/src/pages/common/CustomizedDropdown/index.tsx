import type { ReactNode } from "react";
import React from "react";
import { createGlobalStyle } from "styled-components";
import type {
  IconName,
  PopoverPosition,
  IPopoverSharedProps,
  MaybeElement,
} from "@blueprintjs/core";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Icon,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { MenuIcons } from "icons/MenuIcons";
import type { Intent } from "constants/DefaultTheme";
import { IntentColors } from "constants/DefaultTheme";
import type { Direction } from "utils/helpers";
import { Directions } from "utils/helpers";
import { getDirectionBased } from "./dropdownHelpers";
import { Skin } from "constants/DefaultTheme";
import {
  Option,
  DropdownContentSection,
  DropdownContent,
  DropdownTrigger,
} from "./StyledComponents";
import type { ButtonProps } from "components/editorComponents/Button";
import Button from "components/editorComponents/Button";

export interface CustomizedDropdownOptionSection {
  isSticky?: boolean;
  options?: CustomizedDropdownOption[];
}

export interface CustomizedDropdownOption {
  content: ReactNode;
  active?: boolean;
  onSelect?: () => void;
  intent?: Intent;
  shouldCloseDropdown?: boolean;
  disabled?: boolean;
}

export interface CustomizedDropdownProps {
  sections: CustomizedDropdownOptionSection[];
  trigger: ButtonProps & {
    content?: ReactNode;
    size?: "large" | "small";
  };
  onCloseDropDown?: () => void;
  openDirection: Direction;
  openOnHover?: boolean;
  usePortal?: boolean;
  skin?: Skin;
  borderRadius?: string;
  customizedDropdownId?: string;
  modifiers?: IPopoverSharedProps["modifiers"];
}

const PopoverStyles = createGlobalStyle<{
  id?: string;
  borderRadius?: string;
}>`
  ${({ borderRadius, id }) => `
    .${id}.${Classes.POPOVER} {
      border-radius: min(${borderRadius}, 0.375rem);
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
  `}
`;

export const getIcon = (icon?: string | MaybeElement, intent?: Intent) => {
  if (icon && typeof icon === "string") {
    if (MenuIcons[icon]) {
      return MenuIcons[icon]({
        color: IntentColors[intent || "secondary"],
        width: 16,
        height: 16,
      });
    }

    const iconNames: string[] = Object.values({ ...IconNames });

    if (iconNames.indexOf(icon) > -1) {
      return (
        <Icon
          color={intent ? IntentColors[intent] : IntentColors["secondary"]}
          icon={icon as IconName}
          iconSize={16}
        />
      );
    }
  }
};

const getContentSection = (
  section: CustomizedDropdownOptionSection,
  skin: Skin,
) => {
  return (
    section.options &&
    section.options.map((option, index) => {
      const shouldClose =
        option.shouldCloseDropdown === undefined || option.shouldCloseDropdown;

      return (
        <Option
          active={!!option.active}
          className={
            shouldClose
              ? `${Classes.POPOVER_DISMISS} t--dropdown-option`
              : "t--dropdown-option"
          }
          disabled={!!option.disabled}
          key={index}
          onClick={option.onSelect}
          skin={skin}
        >
          {option.content}
        </Option>
      );
    })
  );
};

export function CustomizedDropdown(props: CustomizedDropdownProps) {
  const skin = props.skin ? props.skin : Skin.LIGHT;
  const icon = getIcon(props.trigger.icon, props.trigger.intent);
  const trigger = (
    <>
      {icon && <div>{icon}</div>}
      {props.trigger.content || (
        <Button
          filled={props.trigger.filled}
          icon={getDirectionBased.ICON_NAME(props.openDirection) as IconName}
          iconAlignment={Directions.RIGHT}
          intent={props.trigger.intent}
          outline={props.trigger.outline}
          size={props.trigger.size}
          skin={skin}
          text={props.trigger.text}
          type="button"
        />
      )}
    </>
  );

  const content = props.sections.map((section, index) => (
    <DropdownContentSection key={index} skin={skin} stick={!!section.isSticky}>
      {getContentSection(section, skin)}
    </DropdownContentSection>
  ));

  return (
    <>
      <Popover
        enforceFocus={false}
        interactionKind={
          props.openOnHover
            ? PopoverInteractionKind.HOVER
            : PopoverInteractionKind.CLICK
        }
        minimal
        modifiers={props.modifiers}
        onClose={() => {
          if (props.onCloseDropDown) {
            props.onCloseDropDown();
          }
        }}
        popoverClassName={props.customizedDropdownId}
        position={
          getDirectionBased.POPPER_POSITION(
            props.openDirection,
          ) as PopoverPosition
        }
      >
        <DropdownTrigger skin={skin}>{trigger}</DropdownTrigger>
        <DropdownContent borderRadius={props.borderRadius} skin={skin}>
          {content}
        </DropdownContent>
      </Popover>
      <PopoverStyles
        borderRadius={props.borderRadius}
        id={props.customizedDropdownId}
      />
    </>
  );
}

export default CustomizedDropdown;
