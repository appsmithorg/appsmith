import React from "react";
import { ThemeCard } from "./ThemeCard";
import { AppTheme } from "entities/AppTheming";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

interface ThemeListProps {
  themes: AppTheme[];
}

function ThemeList(props: ThemeListProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <>
      {props.themes.map((theme, index) => (
        <ThemeCard
          isSelected={selectedTheme.name === theme.name}
          key={index}
          selectable
          theme={theme}
        />
      ))}
    </>
  );
}

export default ThemeList;
