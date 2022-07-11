import classNames from "classnames";
import React, { useCallback } from "react";

import { AppTheme } from "entities/AppTheming";
import { TooltipComponent } from "design-system";

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

  /**
   * changes the border in theme
   */
  const onChangeBorder = useCallback(
    (optionKey: string) => {
      updateTheme({
        ...theme,
        properties: {
          ...theme.properties,
          borderRadius: {
            [sectionName]: options[optionKey],
          },
        },
      });
    },
    [updateTheme, theme],
  );

  return (
    <div className="grid grid-cols-6 gap-2 auto-cols-max">
      {Object.keys(options).map((optionKey) => (
        <TooltipComponent content={optionKey} key={optionKey}>
          <button
            className={classNames({
              "flex items-center justify-center w-8 h-8 bg-white ring-1 cursor-pointer hover:bg-trueGray-50": true,
              "ring-gray-800": selectedOption === options[optionKey],
              "ring-gray-300": selectedOption !== options[optionKey],
              [`t--theme-${sectionName}`]: true,
            })}
            onClick={() => onChangeBorder(optionKey)}
          >
            <div
              className={classNames({
                "w-5 h-5 border-t-2 border-l-2": true,
                "border-gray-800": selectedOption === options[optionKey],
                "border-gray-500": selectedOption !== options[optionKey],
              })}
              style={{
                borderTopLeftRadius: options[optionKey],
              }}
            />
          </button>
        </TooltipComponent>
      ))}
    </div>
  );
}

export default ThemeBorderRadiusControl;
