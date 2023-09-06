import React, { useCallback } from "react";
import { useParams } from "react-router";
import { DSFormHeader } from "../../Editor/DataSourceEditor/DSFormHeader";
import {
  getDatasource,
  getPlugin,
  getPluginImages,
} from "../../../selectors/entitiesSelector";
import type { Datasource } from "../../../entities/Datasource";
import type { ApiDatasourceForm } from "../../../entities/Datasource/RestAPIForm";
import { useDispatch, useSelector } from "react-redux";
import _, { get } from "lodash";
import { setDatasourceViewMode } from "../../../actions/datasourceActions";
import { isDatasourceInViewMode } from "../../../selectors/ui";
import DatasourceInformation from "../../Editor/DataSourceEditor/DatasourceSection";
import styled from "styled-components";
import { ViewModeWrapper } from "../../Editor/DataSourceEditor/DBForm";
import EditDatasourceModal from "./EditDatasourceModal";

const DatasourceViewInfo = styled.div`
  padding: 0 20px;
`;

const DataMainPane = () => {
  const dispatch = useDispatch();
  const params = useParams<{ dataId: string; appId: string }>();
  const datasourceId = params.dataId;
  const datasource = useSelector((state) =>
    getDatasource(state, datasourceId),
  ) as Datasource | ApiDatasourceForm;

  const pluginId = get(datasource, "pluginId", "");
  const pluginImage = useSelector(getPluginImages)[pluginId];
  const plugin = useSelector((state) => getPlugin(state, pluginId));
  const pluginName = plugin?.name ?? "";
  const pluginType = plugin?.type ?? "";
  const setViewMode = useCallback(
    (payload: { datasourceId: string; viewMode: boolean }) => {
      dispatch(setDatasourceViewMode(payload));
    },
    [],
  );
  const viewMode = useSelector(isDatasourceInViewMode);
  const formConfigs = useSelector(
    (state) => state.entities.plugins.formConfigs,
  );
  const formConfig = formConfigs[pluginId];
  if (!datasource) return null;
  return (
    <>
      <DSFormHeader
        canCreateDatasourceActions
        canDeleteDatasource={false}
        canManageDatasource={false}
        datasource={datasource}
        datasourceId={datasourceId}
        isDeleting={false}
        isNewDatasource={false}
        isPluginAuthorized
        pluginImage={pluginImage}
        pluginName={pluginName}
        pluginType={pluginType}
        setDatasourceViewMode={setViewMode}
        viewMode
      />
      <DatasourceViewInfo>
        <ViewModeWrapper>
          {!_.isNil(formConfig) && !_.isNil(datasource) ? (
            <DatasourceInformation
              config={formConfig[0]}
              datasource={datasource}
              viewMode={viewMode}
            />
          ) : undefined}
        </ViewModeWrapper>
      </DatasourceViewInfo>
      <EditDatasourceModal datasource={datasource} />
    </>
  );
};

export default DataMainPane;
