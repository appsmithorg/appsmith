import React, { useCallback } from "react";

import { SegmentedControl, Tooltip } from "design-system";
import type { ThemeSetting } from "constants/AppConstants";
import { BORDER_RADIUS_OPTIONS } from "widgets/wds/constants";

interface ThemeBorderRadiusControlProps {
  theme: ThemeSetting;
  updateTheme: (theme: ThemeSetting) => void;
}

function ThemeBorderRadiusControl(props: ThemeBorderRadiusControlProps) {
  const { theme, updateTheme } = props;

  /**
   * changes the border in theme
   */
  const onChangeBorder = useCallback(
    (value: string) => {
      updateTheme({ ...theme, borderRadius: value });
    },
    [updateTheme, theme],
  );

  const selectedOptionKey = theme.borderRadius;

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
