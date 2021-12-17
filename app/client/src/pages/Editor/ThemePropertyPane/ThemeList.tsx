import React from "react";
import { ThemeCard } from "./ThemeCard";
import { AppTheme } from "entities/AppTheming";
import { useSelector } from "react-redux";
import {
  getPreviewAppTheme,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";

interface ThemeListProps {
  themes: AppTheme[];
}

function ThemeList(props: ThemeListProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const previewTheme = useSelector(getPreviewAppTheme);

  return (
    <>
      {props.themes.map((theme, index) => (
        <ThemeCard
          isSelected={
            (previewTheme ? previewTheme.name : selectedTheme.name) ===
            theme.name
          }
          key={index}
          selectable
          theme={theme}
        />
      ))}
    </>
  );
}

export default ThemeList;
