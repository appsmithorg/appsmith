import React from "react";
import { ThemeCard } from "./ThemeCard";
import { AppTheme } from "entities/AppTheming";
import { useSelector } from "react-redux";
import { getPreviewAppTheme } from "selectors/appThemingSelectors";

interface ThemeListProps {
  themes: AppTheme[];
}

function ThemeList(props: ThemeListProps) {
  const previewTheme = useSelector(getPreviewAppTheme);

  return (
    <>
      {props.themes.map((theme, index) => (
        <ThemeCard
          isSelected={previewTheme && previewTheme.name === theme.name}
          key={index}
          selectable
          theme={theme}
        />
      ))}
    </>
  );
}

export default ThemeList;
