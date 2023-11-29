import React, { useState } from "react";

import { Switch } from "design-system";
import ColorPickerComponent from "components/propertyControls/ColorPickerComponentV2";
import type { ThemeSetting } from "constants/AppConstants";

interface ThemeColorControlProps {
  theme: ThemeSetting;
  updateTheme: (theme: ThemeSetting) => void;
}

function ThemeColorControl(props: ThemeColorControlProps) {
  const { theme, updateTheme } = props;
  const [autoFocus, setAutoFocus] = useState(false);
  const [isFullColorPicker, setFullColorPicker] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <h3>Accent Color</h3>
        <ColorPickerComponent
          autoFocus={autoFocus}
          changeColor={(color: string) => {
            updateTheme({ ...theme, accentColor: color });
          }}
          color={theme.accentColor}
          isFullColorPicker={isFullColorPicker}
          isOpen={autoFocus}
          onPopupClosed={() => setAutoFocus(false)}
          portalContainer={
            document.getElementById("app-settings-portal") || undefined
          }
          setFullColorPicker={setFullColorPicker}
        />
      </div>
      <div className="mt-2">
        <Switch
          defaultSelected={theme.colorMode === "dark"}
          onChange={(isSelected: boolean) => {
            updateTheme({ ...theme, colorMode: isSelected ? "dark" : "light" });
          }}
        >
          DarkMode
        </Switch>
      </div>
    </div>
  );
}

export default ThemeColorControl;
