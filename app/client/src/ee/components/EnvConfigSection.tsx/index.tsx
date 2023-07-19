import type { ReactElement } from "react";
import type { DatasourceStorage } from "entities/Datasource";

type Props = {
  datasourceStorages: Record<string, DatasourceStorage>;
  children: ReactElement;
};

export function EnvConfigSection({ children }: Props) {
  return children;
}
