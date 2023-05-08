import React, { useCallback } from "react";
import type { AppTheme } from "entities/AppTheming";
import { Icon, Tooltip } from "design-system";
import { invertedBoxShadowOptions } from "constants/ThemeConstants";
import { SegmentedControl } from "design-system";

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

  const selectedOptionKey = selectedOption
    ? invertedBoxShadowOptions[selectedOption]
    : "";

  const buttonGroupOptions = Object.keys(options).map((optionKey) => ({
    label: (
      <Tooltip content={optionKey} key={optionKey}>
        {optionKey === "none" ? (
          <div className="flex items-center justify-center w-5 h-5">
            <Icon name="close-line" size="md" />
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-5 h-5 bg-white"
            style={{ boxShadow: options[optionKey] }}
          />
        )}
      </Tooltip>
    ),
    value: optionKey,
  }));

  return (
    <SegmentedControl
      isFullWidth={false}
      onChange={onChangeShadow}
      options={buttonGroupOptions}
      value={selectedOptionKey}
    />
  );
}

export default ThemeBoxShadowControl;
