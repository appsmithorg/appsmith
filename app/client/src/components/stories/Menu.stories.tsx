import React, { useState } from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Menu from "components/ads/Menu";
import { action } from "@storybook/addon-actions";
import MenuDivider from "components/ads/MenuDivider";
import MenuItem from "components/ads/MenuItem";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import ColorSelector from "components/ads/ColorSelector";
import { AppIconCollection } from "components/ads/AppIcon";
import IconSelector from "components/ads/IconSelector";
import EditableText, {
  SavingState,
  EditInteractionKind,
} from "components/ads/EditableText";
import { IconCollection, IconName } from "components/ads/Icon";
import { theme } from "constants/DefaultTheme";

export default {
  title: "Menu",
  component: Menu,
  decorators: [withKnobs, withDesign],
};

const errorFunction = (name: string) => {
  if (name === "") {
    return "Name cannot be empty";
  } else {
    return false;
  }
};

export function MenuStory() {
  const [selectedColor, setSelectedColor] = useState<string>(
    theme.colors.appCardColors[0],
  );
  const [savingState, SetSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
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
        position={select("Position", Object.values(Position), Position.RIGHT)}
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
          onBlur={() => {
            SetSavingState(SavingState.STARTED);
            setTimeout(() => {
              SetSavingState(SavingState.SUCCESS);
            }, 2000);
          }}
          onTextChanged={action("editable-input-changed")}
          placeholder={"Edit text input"}
          savingState={savingState}
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
          selectedIcon={select("Select app icon", AppIconCollection, "bag")}
        />
        <MenuDivider />
        <MenuItem
          disabled={boolean("First option disabled", false)}
          icon={select(
            "First Icon",
            ["Select icon" as IconName, ...IconCollection],
            "Select icon" as IconName,
          )}
          label={<span>W</span>}
          onSelect={action("clicked-first-option")}
          text={text("First option", "Invite user")}
        />
        {boolean("First menu item divider", false) ? <MenuDivider /> : null}
        <MenuItem
          icon={select(
            "Second Icon",
            ["Select icon" as IconName, ...IconCollection],
            "Select icon" as IconName,
          )}
          label={<span>W</span>}
          onSelect={action("clicked-second-option")}
          text={text("Second option", "Are you sure")}
        />
        {boolean("Second menu item divider", false) ? <MenuDivider /> : null}
        <MenuItem
          onSelect={action("clicked-third-option")}
          text={text("Third option", "Third option text only")}
        />
      </Menu>
    </div>
  );
}
