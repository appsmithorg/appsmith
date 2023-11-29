import React, { useCallback } from "react";

import { SegmentedControl } from "design-system";
import type { ThemeSetting } from "constants/AppConstants";

interface ThemeSpacingControlProps {
  theme: ThemeSetting;
  updateTheme: (theme: ThemeSetting) => void;
}

const options = [
  {
    label: "Small",
    value: "0.8",
  },
  {
    label: "Medium",
    value: "1",
  },
  {
    label: "Big",
    value: "1.2",
  },
];

function ThemeSizingControl(props: ThemeSpacingControlProps) {
  const { theme, updateTheme } = props;

  /**
   * changes the border in theme
   */
  const onChangeBorder = useCallback(
    (value: string) => {
      updateTheme({ ...theme, sizing: Number(value) });
    },
    [updateTheme, theme],
  );

  const selectedOptionKey = theme.sizing.toString();

  return (
    <SegmentedControl
      isFullWidth={false}
      onChange={onChangeBorder}
      options={options}
      value={selectedOptionKey}
    />
  );
}

export default ThemeSizingControl;
