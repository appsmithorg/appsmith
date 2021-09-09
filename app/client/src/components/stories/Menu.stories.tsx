import React, { useState } from "react";
import { withDesign } from "storybook-addon-designs";
import Menu, { MenuProps } from "components/ads/Menu";
import { action } from "@storybook/addon-actions";
import MenuDivider from "components/ads/MenuDivider";
import MenuItem from "components/ads/MenuItem";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import ColorSelector from "components/ads/ColorSelector";
import IconSelector from "components/ads/IconSelector";
import EditableText, {
  SavingState,
  EditInteractionKind,
} from "components/ads/EditableText";
import { theme } from "constants/DefaultTheme";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.menus.menu.PATH,
  component: IconSelector,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

const errorFunction = (name: string) => {
  if (name === "") {
    return "Name cannot be empty";
  } else {
    return false;
  }
};

export function MenuStory(args: MenuProps) {
  const [selectedColor, setSelectedColor] = useState<string>(
    theme.colors.appCardColors[0],
  );
  return (
    <div
      style={{
        background: "#1A191C",
        height: "500px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Menu
        {...args}
        onClose={action("menu-closed")}
        onOpening={action("menu-opended")}
        target={
          <div>
            <svg
              fill="none"
              height="22"
              viewBox="0 0 22 22"
              width="22"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect fill="black" fillOpacity="0.1" height="22" width="22" />
              <path
                clipRule="evenodd"
                d="M6 11C6 12.105 5.105 13 4 13C2.895 13 2 12.105 2 11C2 9.895 2.895 9 4 9C5.105 9 6 9.895 6 11ZM11 9C12.105 9 13 9.895 13 11C13 12.105 12.105 13 11 13C9.895 13 9 12.105 9 11C9 9.895 9.895 9 11 9ZM20 11C20 9.895 19.105 9 18 9C16.895 9 16 9.895 16 11C16 12.105 16.895 13 18 13C19.105 13 20 12.105 20 11Z"
                fill="white"
                fillRule="evenodd"
              />
            </svg>
          </div>
        }
      >
        <EditableText
          defaultValue="Product design app"
          editInteractionKind={EditInteractionKind.SINGLE}
          fill={false}
          hideEditIcon={false}
          isEditingDefault={false}
          isInvalid={(name: any) => errorFunction(name)}
          onBlur={action("editable-input-blured")}
          onTextChanged={action("editable-input-changed")}
          placeholder={"Edit text input"}
          savingState={SavingState.NOT_STARTED}
          valueTransform={(value: any) => value.toUpperCase()}
        />
        <ColorSelector
          colorPalette={theme.colors.appCardColors}
          fill={false}
          onSelect={(value: string) => setSelectedColor(value)}
        />
        <MenuDivider />
        <IconSelector
          fill={false}
          onSelect={action("icon-selected")}
          selectedColor={selectedColor}
          selectedIcon="bag"
        />
        <MenuDivider />
        <MenuItem
          label={<span>W</span>}
          onSelect={action("clicked-first-option")}
          text="Invite user"
        />
        <MenuItem
          icon="bug"
          label={<span>W</span>}
          onSelect={action("clicked-second-option")}
          text="Are you sure"
        />
        <MenuDivider />
        <MenuItem
          onSelect={action("clicked-third-option")}
          text="Third option text only"
        />
      </Menu>
    </div>
  );
}

MenuStory.args = {
  position: Position.RIGHT,
  isOpen: false,
  canEscapeKeyClose: true,
  canOutsideClickClose: true,
  menuItemWrapperWidth: 200,
};

MenuStory.argTypes = {
  target: {
    control: controlType.OBJECT,
    description: "JSX.Element",
  },
  position: {
    control: controlType.SELECT,
    options: Object.values(Position),
  },
  isOpen: { control: controlType.BOOLEAN },
  canEscapeKeyClose: { control: controlType.BOOLEAN },
  canOutsideClickClose: { control: controlType.BOOLEAN },
  menuItemWrapperWidth: { control: controlType.NUMBER },
};

MenuStory.storyName = storyName.platform.menus.menu.NAME;
