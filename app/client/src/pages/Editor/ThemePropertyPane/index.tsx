import React, { useState } from "react";
import * as Sentry from "@sentry/react";

import { ThemeCard } from "./ThemeCard";
import { SettingSection } from "./SettingSection";
import { ButtonBorderRadiusTypes } from "components/constants";
import ThemeShadowProperty from "./controls/ThemeShadowControl";
import ThemeBorderRadiusProperty from "./controls/ThemeBorderRadiusControl";

export function ThemePropertyPane() {
  const [isThemeSelectionMode, setThemeSelectionMode] = useState(false);

  return (
    <div className="relative py-3 space-y-4">
      <header className="px-3">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard />
      </header>
      <div>
        <SettingSection className="border-t" isOpen title="General Styling">
          <section>
            <h3 className="font-semibold">Colors</h3>
          </section>
        </SettingSection>
        <SettingSection className="border-t" isOpen title="Advanced">
          <ThemeBorderRadiusProperty />
          <ThemeShadowProperty />
        </SettingSection>
      </div>
    </div>
  );
}

ThemePropertyPane.displayName = "ThemePropertyPane";

export default Sentry.withProfiler(ThemePropertyPane);
