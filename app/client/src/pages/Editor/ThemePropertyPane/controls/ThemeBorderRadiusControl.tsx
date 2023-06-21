import React, { useCallback } from "react";

import type { AppTheme } from "entities/AppTheming";
import { invertedBorderRadiusOptions } from "constants/ThemeConstants";
import { SegmentedControl, Tooltip } from "design-system";

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
      <Tooltip content={optionKey} key={optionKey}>
        <div
          className="w-5 h-5 t--theme-appBorderRadius border-t-2 border-l-2"
          style={{
            borderTopLeftRadius: options[optionKey],
            borderColor: "var(--ads-v2-color-fg)",
          }}
        />
      </Tooltip>
    ),
    value: optionKey,
  }));

  return (
    <SegmentedControl
      isFullWidth={false}
      onChange={onChangeBorder}
      options={buttonGroupOptions}
      value={selectedOptionKey}
    />
  );
}

export default ThemeBorderRadiusControl;
