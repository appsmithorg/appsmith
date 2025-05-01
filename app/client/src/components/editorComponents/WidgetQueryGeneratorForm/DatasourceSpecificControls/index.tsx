import type { DefaultRootState } from "react-redux";
import { PluginPackageName } from "entities/Plugin";
import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { getPluginPackageFromDatasourceId } from "ee/selectors/entitiesSelector";
import { WidgetQueryGeneratorFormContext } from "..";
import { Section } from "../styles";
import { GoogleSheetControls } from "./GoogleSheetControls";

export function DatasourceSpecificControls() {
  const { config } = useContext(WidgetQueryGeneratorFormContext);

  const selectedDatasourcePluginPackageName = useSelector(
    (state: DefaultRootState) =>
      getPluginPackageFromDatasourceId(state, config.datasource),
  );

  return (
    <Section>
      {selectedDatasourcePluginPackageName ===
        PluginPackageName.GOOGLE_SHEETS && <GoogleSheetControls />}
    </Section>
  );
}
