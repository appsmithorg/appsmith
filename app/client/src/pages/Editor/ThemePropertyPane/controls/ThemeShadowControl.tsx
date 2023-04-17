import React, { useCallback } from "react";
import type { AppTheme } from "entities/AppTheming";
import { Icon } from "design-system";
import { invertedBoxShadowOptions } from "constants/ThemeConstants";
import { SegmentedControl } from "design-system";

const optionLabels = {
  S: "sm",
  M: "md",
  L: "lg",
};

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
      <div className="w-5 h-5">
        {optionKey === "none" ? (
          <Icon name="close-x" size="8px" />
        ) : (
          // @ts-expect-error: object key type mismatch
          optionLabels[optionKey]
        )}
      </div>
    ),
    value: optionKey,
  }));

  return (
    <SegmentedControl
      defaultValue={selectedOptionKey}
      isFullWidth={false}
      onChange={onChangeShadow}
      options={buttonGroupOptions}
    />
  );
}

export default ThemeBoxShadowControl;
