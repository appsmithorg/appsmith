import React from "react";

import ThemeCard from "./ThemeCard";
import SettingSection from "./SettingSection";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import ThemeColorControl from "./controls/ThemeColorControl";

function ThemeEditor() {
  return (
    <>
      <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard />
      </header>
      <main>
        <SettingSection className="border-t" isOpen title="General Styling">
          <section>
            <h3 className="font-semibold">Colors</h3>
            <section>
              <h4>Primary Color</h4>
              <ThemeColorControl />
            </section>
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
