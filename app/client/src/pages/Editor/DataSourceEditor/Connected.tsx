import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import type { AppState } from "@appsmith/reducers";
import { isNil } from "lodash";
import { getDatasource } from "selectors/entitiesSelector";
import styled from "styled-components";
import RenderDatasourceInformation from "./DatasourceSection";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #d0d7dd;
  padding-top: 24px;
  padding-bottom: 24px;
`;

function Connected({
  errorComponent,
}: {
  errorComponent?: JSX.Element | null;
  showDatasourceSavedText?: boolean;
}) {
  const params = useParams<{ datasourceId: string }>();

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );

  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];

  return (
    <Wrapper>
      {errorComponent}
      <div>
        {!isNil(currentFormConfig) && !isNil(datasource) ? (
          <RenderDatasourceInformation
            config={currentFormConfig[0]}
            datasource={datasource}
          />
        ) : undefined}
      </div>
    </Wrapper>
  );
}

export default Connected;
