import React, { useCallback } from "react";

import type { AppTheme } from "entities/AppTheming";
import { Icon } from "design-system";
import { invertedBorderRadiusOptions } from "constants/ThemeConstants";
import { SegmentedControl } from "design-system";

const optionLabels = {
  S: "sm",
  M: "md",
  L: "lg",
};

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
      onChange={onChangeBorder}
      options={buttonGroupOptions}
    />
  );
}

export default ThemeBorderRadiusControl;
