import { tw } from "twind";
import { startCase } from "lodash";
import React, { useState } from "react";

import { AppTheme } from "entities/AppTheming";
import TooltipComponent from "components/ads/Tooltip";
import ColorPickerComponent from "components/ads/ColorPickerComponentV2";

interface ThemeColorControlProps {
  theme: AppTheme;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeColorControl(props: ThemeColorControlProps) {
  const { theme, updateTheme } = props;
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const userDefinedColors = theme.properties.colors;

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {Object.keys(theme.config.colors).map(
          (colorName: string, index: number) => {
            return (
              <TooltipComponent content={startCase(colorName)} key={index}>
                <div
                  className={`${tw`bg-[${userDefinedColors[colorName]}] ${
                    selectedColor === colorName ? "ring-1" : ""
                  }`} w-6 h-6 border-2 cursor-pointer ring-primary-400`}
                  onClick={() => {
                    setSelectedColor(colorName);
                  }}
                />
              </TooltipComponent>
            );
          },
        )}
      </div>
      {selectedColor && (
        <div className="pt-1">
          <ColorPickerComponent
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
            showThemeColors
          />
        </div>
      )}
    </div>
  );
}

export default ThemeColorControl;
