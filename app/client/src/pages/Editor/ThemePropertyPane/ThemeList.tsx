import React from "react";
import { ThemeCard } from "./ThemeCard";

const themes = [
  {
    name: "Rounded",
    created_by: "@appsmith",
    config: {
      boxShadow: "xl",
      boxShadowColor: "red",
      borderRadius: "2xl",
      colors: {
        primaryColor: "#38AFF4",
        backgroundColor: "#e1e1e1",
      },
    },
  },
  {
    name: "Default",
    created_by: "@appsmith",
    config: {
      boxShadow: "md",
      boxShadowColor: "red",
      borderRadius: "md",
      colors: {
        primaryColor: "#F86A2B",
        backgroundColor: "#e1e1e1",
      },
    },
  },
  {
    name: "Sharp",
    created_by: "@appsmith",
    config: {
      boxShadow: "none",
      boxShadowColor: "red",
      borderRadius: "none",
      colors: {
        primaryColor: "#8B5CF6",
        backgroundColor: "#e1e1e1",
      },
    },
  },
];

function ThemeList() {
  return (
    <>
      {themes.map((theme, index) => (
        <ThemeCard
          backgroundColor={theme.config.colors.backgroundColor}
          borderRadius={theme.config.borderRadius}
          boxShadow={theme.config.boxShadow}
          isSelected={index === 0}
          key={theme.name}
          primaryColor={theme.config.colors.primaryColor}
        />
      ))}
    </>
  );
}

export default ThemeList;
