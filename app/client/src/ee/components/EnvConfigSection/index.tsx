import type { Datasource } from "entities/Datasource";
import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";

interface Props {
  currentEnv: string;
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
  return renderDatasourceSection(config, currentEnv, datasource, viewMode);
}
