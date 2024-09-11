import type { Datasource } from "entities/Datasource";
import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";

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
  return renderDatasourceSection(config, currentEnv, datasource, viewMode);
}
