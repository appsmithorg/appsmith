import React, { useCallback } from "react";

import type { AppTheme } from "entities/AppTheming";
import { TooltipComponent } from "design-system-old";
import { invertedBorderRadiusOptions } from "constants/ThemeConstants";
import { SegmentedControl } from "design-system";

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
    (value: string) => {
      updateTheme({
        ...theme,
        properties: {
          ...theme.properties,
          borderRadius: {
            [sectionName]: options[value],
          },
        },
      });
    },
    [updateTheme, theme],
  );

  const selectedOptionKey = selectedOption
    ? invertedBorderRadiusOptions[selectedOption]
    : "";

  const buttonGroupOptions = Object.keys(options).map((optionKey) => ({
    label: (
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
    <SegmentedControl
      defaultValue={selectedOptionKey}
      isFullWidth={false}
      // @ts-expect-error: Type mismatch
      onChange={onChangeBorder}
      options={buttonGroupOptions}
    />
  );
}

export default ThemeBorderRadiusControl;
