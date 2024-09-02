import type { AppState } from "ee/reducers";
import { PluginPackageName } from "entities/Action";
import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { getPluginPackageFromDatasourceId } from "ee/selectors/entitiesSelector";
import { WidgetQueryGeneratorFormContext } from "..";
import { Section } from "../styles";
import { GoogleSheetControls } from "./GoogleSheetControls";

export function DatasourceSpecificControls() {
  const { config } = useContext(WidgetQueryGeneratorFormContext);

  const selectedDatasourcePluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, config.datasource),
  );

  return (
    <Section>
      {selectedDatasourcePluginPackageName ===
        PluginPackageName.GOOGLE_SHEETS && <GoogleSheetControls />}
    </Section>
  );
}
