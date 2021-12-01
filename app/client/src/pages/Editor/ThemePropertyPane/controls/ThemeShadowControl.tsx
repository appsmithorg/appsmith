import React from "react";
import { css, tw } from "twind/css";

import TooltipComponent from "components/ads/Tooltip";
import { AppTheme } from "entities/AppTheming";

interface ThemeBoxShadowControlProps {
  options: {
    [key: string]: string;
  };
  selectedOption?: string;
  theme: AppTheme;
  sectionName: string;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeShadowControl(props: ThemeBoxShadowControlProps) {
  const { options, sectionName, selectedOption, theme, updateTheme } = props;

  return (
    <div className="grid grid-flow-col auto-cols-max gap-2">
      {Object.keys(options).map((optionKey) => (
        <TooltipComponent content={optionKey} key={optionKey}>
          <button
            className={`flex items-center justify-center w-8 h-8 bg-white border ring-primary-400 ${
              selectedOption === options[optionKey] ? "ring-1" : ""
            }`}
            onClick={() => {
              updateTheme({
                ...theme,
                properties: {
                  ...theme.properties,
                  boxShadow: {
                    [sectionName]: options[optionKey],
                  },
                },
              });
            }}
          >
            <div
              className={`flex items-center  justify-center w-5 h-5 bg-white ${tw`${css(
                {
                  "&": {
                    boxShadow: options[optionKey],
                  },
                },
              )}`}`}
            />
          </button>
        </TooltipComponent>
      ))}
    </div>
  );
}

export default ThemeShadowControl;
