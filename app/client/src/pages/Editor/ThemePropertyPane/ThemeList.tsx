import React from "react";
import { ThemeCard } from "./ThemeCard";
import { AppTheme } from "entities/AppTheming";
import { useSelector } from "react-redux";

interface ThemeListProps {
  themes: AppTheme[];
}

function ThemeList(props: ThemeListProps) {
  return (
    <>
      {props.themes.map((theme, index) => (
        <ThemeCard key={index} selectable theme={theme} />
      ))}
    </>
  );
}

export default ThemeList;
