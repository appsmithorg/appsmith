import type { Datasource, DatasourceStorage } from "entities/Datasource";
import React from "react";
import type { EnvironmentType } from "@appsmith/reducers/environmentReducer";
import { getEnvironments } from "@appsmith/selectors/environmentSelectors";
import { useSelector } from "react-redux";
import { Text } from "design-system";
import { capitalizeFirstLetter } from "utils/helpers";
import { renderDatasourceSection } from "pages/Editor/DataSourceEditor/DatasourceSection";

type Props = {
  currentEnv: string;
  config: any;
  datasource: Datasource;
  viewMode: boolean | undefined;
};

export function EnvConfigSection({
  config,
  currentEnv,
  datasource,
  viewMode,
}: Props) {
  const environments = useSelector(getEnvironments);
  const { datasourceStorages } = datasource;

  const checkIfStorageIsValid = (storage: DatasourceStorage | undefined) => {
    return (
      !!storage &&
      storage.hasOwnProperty("id") &&
      storage.hasOwnProperty("datasourceId") &&
      storage.hasOwnProperty("datasourceConfiguration")
    );
  };

  if (!environments || environments.length === 0) {
    return renderDatasourceSection(config, currentEnv, datasource, viewMode);
  }

  return (
    <>
      {environments.map((env: EnvironmentType) => {
        // check if key is present in the environments
        const envId = env.id;
        const storageValueForEnv = datasourceStorages.hasOwnProperty(envId)
          ? datasourceStorages[envId]
          : undefined;
        if (checkIfStorageIsValid(storageValueForEnv)) {
          return (
            <>
              <Text
                data-testid={`t--review-section-${env.name}`}
                kind={"heading-m"}
              >{`${capitalizeFirstLetter(env.name)} Environment`}</Text>
              {renderDatasourceSection(config, envId, datasource, viewMode)}
            </>
          );
        }
      })}
    </>
  );
}
