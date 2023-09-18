import { startCase } from "lodash";
import React, { useState } from "react";
import styled from "styled-components";

import type { AppTheme } from "entities/AppTheming";
import { Tooltip } from "design-system";
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
  const [selectedColor, setSelectedColor] = useState<string>("primaryColor");
  const [isFullColorPicker, setFullColorPicker] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {Object.keys(theme.properties.colors).map(
          (colorName: string, index: number) => {
            return (
              <Tooltip
                content={capitalizeFirstLetter(startCase(colorName))}
                key={index}
              >
                <ColorBox
                  background={userDefinedColors[colorName]}
                  className={selectedColor === colorName ? "selected" : ""}
                  data-testid={`theme-${colorName}`}
                  onClick={() => {
                    setAutoFocus(
                      selectedColor === colorName ? !autoFocus : true,
                    );
                    setSelectedColor(colorName);
                  }}
                />
              </Tooltip>
            );
          },
        )}
      </div>
      {selectedColor && (
        <div className="pt-1 space-y-1">
          <h3>{capitalizeFirstLetter(startCase(selectedColor))}</h3>
          <ColorPickerComponent
            autoFocus={autoFocus}
            changeColor={(color: string) => {
              updateTheme({
                ...theme,
                properties: {
                  ...theme.properties,
                  colors: {
                    ...theme.properties.colors,
                    [selectedColor]: color,
                  },
                },
              });
            }}
            color={userDefinedColors[selectedColor]}
            isFullColorPicker={isFullColorPicker}
            isOpen={autoFocus}
            key={selectedColor}
            onPopupClosed={() => setAutoFocus(false)}
            portalContainer={
              document.getElementById("app-settings-portal") || undefined
            }
            setFullColorPicker={setFullColorPicker}
          />
        </div>
      )}
    </div>
  );
}

export default ThemeColorControl;
