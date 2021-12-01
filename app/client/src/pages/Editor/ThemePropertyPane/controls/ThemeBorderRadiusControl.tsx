import { tw } from "twind";
import React from "react";
import TooltipComponent from "components/ads/Tooltip";
import { AppTheme } from "entities/AppTheming";

interface ThemeBorderRadiusControlProps {
  options: {
    [key: string]: string;
  };
  selectedOption?: string;
  theme: AppTheme;
  sectionName: string;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeBorderRadiusControl(props: ThemeBorderRadiusControlProps) {
  const { options, sectionName, selectedOption, theme, updateTheme } = props;

  return (
    <div className="grid grid-flow-col auto-cols-max gap-2">
      {Object.keys(options).map((optionKey) => (
        <TooltipComponent content={optionKey} key={optionKey}>
          <button
            className={`flex items-center justify-center w-8 h-8 bg-trueGray-100 ring-primary-500 cursor-pointer hover:bg-trueGray-50 ${
              selectedOption === options[optionKey] ? "ring-1" : ""
            }`}
            onClick={() => {
              updateTheme({
                ...theme,
                properties: {
                  ...theme.properties,
                  borderRadius: {
                    [sectionName]: options[optionKey],
                  },
                },
              });
            }}
          >
            <div
              className={`${tw`rounded-tl-[${options[optionKey]}]`} w-4 h-4 border-t-2 border-l-2 rounded- border-gray-600`}
            />
          </button>
        </TooltipComponent>
      ))}
    </div>
  );
}

export default ThemeBorderRadiusControl;
