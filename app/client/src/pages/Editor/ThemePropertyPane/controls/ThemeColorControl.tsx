import { startCase } from "lodash";
import React, { useCallback, useState } from "react";
import styled from "styled-components";

import type { AppTheme } from "entities/AppTheming";
import { Tooltip } from "@appsmith/ads";
import ColorPickerComponent from "components/propertyControls/ColorPickerComponentV2";
import { capitalizeFirstLetter } from "utils/helpers";
import { objectKeys } from "@appsmith/utils";

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

  const onColorClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const colorName = e.currentTarget.getAttribute("data-color-name");
      if (!colorName) return;

      setAutoFocus(selectedColor === colorName ? !autoFocus : true);
      setSelectedColor(colorName);
    },
    [autoFocus, selectedColor],
  );

  const onChangeColor = useCallback(
    (color: string) => {
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
    },
    [selectedColor, theme, updateTheme],
  );

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {objectKeys(theme.properties.colors).map((colorName, index) => {
          return (
            <Tooltip
              content={capitalizeFirstLetter(startCase(colorName as string))}
              key={index}
            >
              <ColorBox
                background={userDefinedColors[colorName]}
                className={selectedColor === colorName ? "selected" : ""}
                data-color-name={colorName}
                data-testid={`theme-${colorName}`}
                onClick={onColorClick}
              />
            </Tooltip>
          );
        })}
      </div>
      {selectedColor && (
        <div className="pt-1 space-y-1">
          <h3>{capitalizeFirstLetter(startCase(selectedColor))}</h3>
          <ColorPickerComponent
            autoFocus={autoFocus}
            changeColor={onChangeColor}
            color={userDefinedColors[selectedColor]}
            data-color={selectedColor}
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
