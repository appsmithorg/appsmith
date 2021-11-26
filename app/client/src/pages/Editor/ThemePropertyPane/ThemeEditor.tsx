import React from "react";

import ThemeCard from "./ThemeCard";
import SettingSection from "./SettingSection";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import ThemeColorControl from "./controls/ThemeColorControl";

const defaultTheme = {
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
};

function ThemeEditor() {
  return (
    <>
      <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard
          backgroundColor={defaultTheme.config.colors.backgroundColor}
          borderRadius={defaultTheme.config.borderRadius}
          boxShadow={defaultTheme.config.boxShadow}
          primaryColor={defaultTheme.config.colors.primaryColor}
        />
      </header>
      <main>
        <SettingSection className="border-t" isOpen title="General Styling">
          <section className="space-y-2">
            <h3 className="font-semibold">Colors</h3>
            <h4>Primary Color</h4>
            <div>
              <ThemeColorControl />
            </div>
          </section>
        </SettingSection>
        <SettingSection className="border-t" isOpen title="Advanced">
          <section className="space-y-2">
            <h3 className="font-semibold">Corners</h3>
            <ThemeBoxShadowControl />
          </section>
          <section className="space-y-2">
            <h3 className="font-semibold">Box shadows</h3>
            <ThemeBorderRadiusControl />
          </section>
        </SettingSection>
      </main>
    </>
  );
}

export default ThemeEditor;
