import React from "react";
import type { Datasource } from "entities/Datasource";
import DatasourceFormRenderer from "pages/Editor/DataSourceEditor/DatasourceFormRenderer";

export interface Props {
  currentEnv: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  datasource: Datasource;
  viewMode: boolean | undefined;
}

export function EnvConfigSection({
  config,
  currentEnv,
  datasource,
  viewMode,
}: Props) {
  return (
    <DatasourceFormRenderer
      currentEnvironment={currentEnv}
      datasource={datasource}
      section={config}
      viewMode={viewMode}
    />
  );
}
