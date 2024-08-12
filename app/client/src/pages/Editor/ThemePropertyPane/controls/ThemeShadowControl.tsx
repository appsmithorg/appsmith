import React, { useCallback } from "react";
import type { AppTheme } from "entities/AppTheming";
import { Icon } from "@appsmith/ads";
import {
  invertedBoxShadowOptions,
  sizeMappings,
} from "constants/ThemeConstants";
import { SegmentedControl } from "@appsmith/ads";

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
    label:
      optionKey === "none" ? (
        <Icon name="close-line" size="md" />
      ) : (
        sizeMappings[optionKey]
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
