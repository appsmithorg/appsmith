import classNames from "classnames";
import React, { useCallback } from "react";

import { AppTheme } from "entities/AppTheming";
import { TooltipComponent } from "design-system";
import CloseLineIcon from "remixicon-react/CloseLineIcon";

interface ThemeBoxShadowControlProps {
  options: {
    [key: string]: string;
  };
  selectedOption?: string;
  theme: AppTheme;
  sectionName: string;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeBoxShadowControl(props: ThemeBoxShadowControlProps) {
  const { options, sectionName, selectedOption, theme, updateTheme } = props;

  /**
   * changes the shadow in the theme
   */
  const onChangeShadow = useCallback(
    (optionKey: string) => {
      updateTheme({
        ...theme,
        properties: {
          ...theme.properties,
          boxShadow: {
            ...theme.properties.boxShadow,
            [sectionName]: options[optionKey],
          },
        },
      });
    },
    [updateTheme, theme],
  );

  return (
    <div className="grid grid-flow-col gap-2 auto-cols-max">
      {Object.keys(options).map((optionKey) => (
        <TooltipComponent content={optionKey} key={optionKey}>
          <button
            className={classNames({
              "flex items-center justify-center w-8 h-8 bg-white border ring-gray-700": true,
              "ring-1": selectedOption === options[optionKey],
            })}
            onClick={() => onChangeShadow(optionKey)}
          >
            <div
              className="flex items-center justify-center w-5 h-5 bg-white"
              style={{
                boxShadow: options[optionKey],
              }}
            >
              {options[optionKey] === "none" && (
                <CloseLineIcon className="text-gray-700" />
              )}
            </div>
          </button>
        </TooltipComponent>
      ))}
    </div>
  );
}

export default ThemeBoxShadowControl;
