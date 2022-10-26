import { startCase } from "lodash";
import classNames from "classnames";
import React, { useState } from "react";
import styled from "styled-components";

import { AppTheme } from "entities/AppTheming";
import { TooltipComponent } from "design-system";
import ColorPickerComponent from "components/propertyControls/ColorPickerComponentV2";

interface ThemeColorControlProps {
  theme: AppTheme;
  updateTheme: (theme: AppTheme) => void;
}

const ColorBox = styled.div<{
  background: string;
}>`
  background: ${({ background }) => background};
`;

function ThemeColorControl(props: ThemeColorControlProps) {
  const { theme, updateTheme } = props;
  const [autoFocus, setAutoFocus] = useState(false);
  const userDefinedColors = theme.properties.colors;
  const [selectedColor, setSelectedColor] = useState<string>("primaryColor");

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {Object.keys(theme.properties.colors).map(
          (colorName: string, index: number) => {
            return (
              <TooltipComponent content={startCase(colorName)} key={index}>
                <ColorBox
                  background={userDefinedColors[colorName]}
                  className={classNames({
                    "w-6 h-6 rounded-full border-2 cursor-pointer ring-gray-700": true,
                    "ring-1": selectedColor === colorName,
                  })}
                  onClick={() => {
                    setAutoFocus(
                      selectedColor === colorName ? !autoFocus : true,
                    );
                    setSelectedColor(colorName);
                  }}
                />
              </TooltipComponent>
            );
          },
        )}
      </div>
      {selectedColor && (
        <div className="pt-1 space-y-1">
          <h3>{startCase(selectedColor)}</h3>
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
            isOpen={autoFocus}
            key={selectedColor}
            portalContainer={
              document.getElementById("app-settings-portal") || undefined
            }
          />
        </div>
      )}
    </div>
  );
}

export default ThemeColorControl;
