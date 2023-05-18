import { PluginPackageName } from "entities/Action";
import React, { useContext } from "react";
import { WidgetQueryGeneratorFormContext } from "..";
import { Section } from "../styles";
import { GoogleSheetControls } from "./GoogleSheetControls";

export function DatasourceSpecificControls() {
  const { config } = useContext(WidgetQueryGeneratorFormContext);

  return (
    <Section>
      {config.datasource.data.pluginPackageName ===
        PluginPackageName.GOOGLE_SHEETS && <GoogleSheetControls />}
    </Section>
  );
}
