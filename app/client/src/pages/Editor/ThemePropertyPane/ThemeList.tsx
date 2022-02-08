import React from "react";
import { ThemeCard } from "./ThemeCard";
import { AppTheme } from "entities/AppTheming";

interface ThemeListProps {
  themes: AppTheme[];
}

function ThemeList(props: ThemeListProps) {
  return (
    <>
      {props.themes.map((theme, index) => (
        <ThemeCard
          deletable={!theme.isSystemTheme}
          key={index}
          selectable
          theme={theme}
        />
      ))}
    </>
  );
}

export default ThemeList;
