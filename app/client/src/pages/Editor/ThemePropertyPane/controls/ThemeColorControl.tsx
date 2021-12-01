import React, { useState } from "react";
import { tw } from "twind";
import ColorPickerComponent from "components/ads/ColorPickerComponentV2";
import TooltipComponent from "components/ads/Tooltip";
import { startCase } from "lodash";
import { AppTheme } from "entities/AppTheming";

interface ThemeColorControlProps {
  theme: AppTheme;
}

function ThemeColorControl(props: ThemeColorControlProps) {
  const { theme } = props;
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const defaultColors = theme.config.colors;
  const userDefinedColors = theme.properties.colors;

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {Object.keys(theme.config.colors).map(
          (colorName: string, index: number) => {
            return (
              <TooltipComponent content={startCase(colorName)} key={index}>
                <div
                  className={`${tw`bg-[${userDefinedColors[colorName] ||
                    defaultColors[
                      colorName
                    ]}]`} w-6 h-6 border-2 cursor-pointer`}
                  onClick={() => {
                    setSelectedColor(colorName);
                  }}
                />
              </TooltipComponent>
            );
          },
        )}
      </div>
      {/* {selectedColor && (
        <div className="pt-1">
          <ColorPickerComponent
            changeColor={() => {
              //
            }}
            color={props.colors[selectedColor]}
          />
        </div>
      )} */}
    </div>
  );
}

export default ThemeColorControl;
