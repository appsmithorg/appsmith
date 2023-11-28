import React, { useCallback } from "react";

import type { AppTheme } from "entities/AppTheming";
import { SegmentedControl, Tooltip } from "design-system";
import { BORDER_RADIUS_OPTIONS } from "widgets/wds/constants";
import { invertedBorderRadiusOptions } from "constants/ThemeConstants";

interface ThemeBorderRadiusControlProps {
  selectedOption?: string;
  theme: AppTheme;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeBorderRadiusControl(props: ThemeBorderRadiusControlProps) {
  const { selectedOption, theme, updateTheme } = props;

  /**
   * changes the border in theme
   */
  const onChangeBorder = useCallback(
    (value: string) => {
      // logic for updating theme
    },
    [updateTheme, theme],
  );

  const selectedOptionKey = selectedOption
    ? invertedBorderRadiusOptions[selectedOption]
    : "";

  const buttonGroupOptions = BORDER_RADIUS_OPTIONS.map((optionKey) => ({
    label: (
      <Tooltip content={optionKey.label} key={optionKey.label}>
        <div
          className="w-5 h-5 border-t-2 border-l-2 t--theme-appBorderRadius"
          style={{
            borderTopLeftRadius: optionKey.value,
            borderColor: "var(--ads-v2-color-fg)",
          }}
        />
      </Tooltip>
    ),
    value: optionKey.value,
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
