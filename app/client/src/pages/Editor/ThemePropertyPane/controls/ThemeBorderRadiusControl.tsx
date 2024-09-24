import React, { useCallback } from "react";

import type { AppTheme } from "entities/AppTheming";
import { invertedBorderRadiusOptions } from "constants/ThemeConstants";
import {
  SegmentedControl,
  type SegmentedControlOption,
  Tooltip,
} from "@appsmith/ads";

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

  const buttonGroupOptions = [
    makeButtonGroupOption("none", options.none),
    makeButtonGroupOption("M", options.M),
    makeButtonGroupOption("L", options.L),
  ];

  return (
    <SegmentedControl
      isFullWidth={false}
      onChange={onChangeBorder}
      options={buttonGroupOptions}
      value={selectedOptionKey}
    />
  );
}

function makeButtonGroupOption(
  key: string,
  value: string,
): SegmentedControlOption {
  return {
    label: (
      <Tooltip content={key} key={key}>
        <div
          className="w-5 h-5 t--theme-appBorderRadius border-t-2 border-l-2"
          style={{
            borderTopLeftRadius: value,
            borderColor: "var(--ads-v2-color-fg)",
          }}
        />
      </Tooltip>
    ),
    value: key,
  };
}

export default ThemeBorderRadiusControl;
