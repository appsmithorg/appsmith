import React, { useCallback } from "react";

import { SegmentedControl } from "design-system";
import type { ThemeSetting } from "constants/AppConstants";

interface ThemeSpacingControlProps {
  theme: ThemeSetting;
  updateTheme: (theme: ThemeSetting) => void;
}

const options = [
  {
    label: "Loose",
    value: "0.8",
  },
  {
    label: "normal",
    value: "1",
  },
  {
    label: "Tight",
    value: "1.2",
  },
];

function ThemeDensityControl(props: ThemeSpacingControlProps) {
  const { theme, updateTheme } = props;

  const onChange = useCallback(
    (value: string) => {
      updateTheme({ ...theme, density: Number(value) });
    },
    [updateTheme, theme],
  );

  const selectedOptionKey = theme.density.toString();

  return (
    <SegmentedControl
      isFullWidth={false}
      onChange={onChange}
      options={options}
      value={selectedOptionKey}
    />
  );
}

export default ThemeDensityControl;
