import React from "react";
import { ThemeCard } from "./ThemeCard";

const themes = [
  {
    name: "Rounded",
    created_by: "@appsmith",
    config: {
      boxShadow: "none",
      boxShadowColor: "red",
      borderRadius: "2xl",
      colors: {
        primaryColor: "red",
        backgroundColor: "blue",
      },
    },
  },
  {
    name: "Default",
    created_by: "@appsmith",
    config: {
      boxShadow: "none",
      boxShadowColor: "red",
      borderRadius: "md",
      colors: {
        primaryColor: "red",
        backgroundColor: "blue",
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
        primaryColor: "red",
        backgroundColor: "blue",
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
          isSelected={index === 0}
          key={theme.name}
          primaryColor={theme.config.colors.primaryColor}
        />
      ))}
    </>
  );
}

export default ThemeList;
