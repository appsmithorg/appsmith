import { startCase } from "lodash";
import React, { useState } from "react";
import styled from "styled-components";

import type { AppTheme } from "entities/AppTheming";
import { Switch, Tooltip } from "design-system";
import ColorPickerComponent from "components/propertyControls/ColorPickerComponentV2";
import { capitalizeFirstLetter } from "utils/helpers";

interface ThemeColorControlProps {
  theme: AppTheme;
  updateTheme: (theme: AppTheme) => void;
}

const ColorBox = styled.div<{
  background: string;
}>`
  background: ${({ background }) => background};
  border: 2px solid var(--ads-v2-color-border);
  width: 20px;
  height: 20px;
  border-radius: var(--ads-v2-border-radius-circle);
  cursor: pointer;
  &.selected {
    border-color: var(--ads-v2-color-border-emphasis);
  }
`;

function ThemeColorControl(props: ThemeColorControlProps) {
  const { theme, updateTheme } = props;
  const [autoFocus, setAutoFocus] = useState(false);
  const userDefinedColors = theme.properties.colors;  
  const [isFullColorPicker, setFullColorPicker] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <h3>Accent Color</h3>
        <ColorPickerComponent
          autoFocus={autoFocus}
          changeColor={(color: string) => {
            setAutoFocus(false);
          }}
          color="red"
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
        <Switch>DarkMode</Switch>
      </div>
    </div>
  );
}

export default ThemeColorControl;
