import React, { useCallback } from "react";

import type { AppTheme } from "entities/AppTheming";
import { ButtonGroup, TooltipComponent } from "design-system-old";
import { invertedBorderRadiusOptions } from "constants/ThemeConstants";

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

  const selectedOptionKey = selectedOption
    ? [invertedBorderRadiusOptions[selectedOption]]
    : [];

  const buttonGroupOptions = Object.keys(options).map((optionKey) => ({
    icon: (
      <TooltipComponent
        content={optionKey}
        key={optionKey}
        openOnTargetFocus={false}
      >
        <div
          className="w-5 h-5 border-t-2 border-l-2 border-gray-500 t--theme-appBorderRadius"
          style={{ borderTopLeftRadius: options[optionKey] }}
        />
      </TooltipComponent>
    ),
    value: optionKey,
  }));

  return (
    <ButtonGroup
      options={buttonGroupOptions}
      selectButton={onChangeBorder}
      values={selectedOptionKey}
    />
  );
}

export default ThemeBorderRadiusControl;
