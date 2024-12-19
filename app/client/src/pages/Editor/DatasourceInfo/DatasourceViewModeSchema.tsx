import { setDatasourcePreviewSelectedTableName } from "actions/datasourceActions";
import type { AppState } from "ee/reducers";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
  getSelectedTableName,
} from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type {
  Datasource,
  DatasourceTable,
  QueryTemplate,
} from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import Table from "PluginActionEditor/components/PluginActionResponse/components/Table";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDatasourceQuery } from "../DataSourceEditor/hooks";
import { DatasourceStructureContainer as DatasourceStructureList } from "./DatasourceStructureContainer";
import DatasourceStructureHeader from "./DatasourceStructureHeader";
import RenderInterimDataState from "./RenderInterimDataState";
import {
  DataWrapperContainer,
  DatasourceDataContainer,
  DatasourceListContainer,
  StructureContainer,
  TableWrapper,
  ViewModeSchemaContainer,
} from "./SchemaViewModeCSS";

interface Props {
  datasource: Datasource;
  setDatasourceViewModeFlag: (viewMode: boolean) => void;
}

const DatasourceViewModeSchema = (props: Props) => {
  const dispatch = useDispatch();

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, props.datasource.id),
  );

  const isDatasourceStructureLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasource.id),
  );

  const [previewData, setPreviewData] = useState([]);
  // this error is for when there's an issue with the datasource structure
  const [previewDataError, setPreviewDataError] = useState(false);

  const tableName = useSelector(getSelectedTableName);

  const { failedFetchingPreviewData, fetchPreviewData, isLoading } =
    useDatasourceQuery({ setPreviewData, setPreviewDataError });

  // default table name to first table
  useEffect(() => {
    if (
      datasourceStructure &&
      !!datasourceStructure.tables &&
      datasourceStructure.tables?.length > 0
    ) {
      dispatch(
        setDatasourcePreviewSelectedTableName(
          datasourceStructure.tables[0].name,
        ),
      );
    }

    // if the datasource structure is loading or undefined or if there's an error in the structure
    // reset the preview data states
    if (
      isDatasourceStructureLoading ||
      !datasourceStructure ||
      !datasourceStructure.tables ||
      (datasourceStructure && datasourceStructure?.error)
    ) {
      setPreviewData([]);
      setPreviewDataError(true);
      dispatch(setDatasourcePreviewSelectedTableName(""));
    }
  }, [datasourceStructure, isDatasourceStructureLoading, dispatch]);

  // this fetches the preview data when the table name changes
  useEffect(() => {
    if (
      !isDatasourceStructureLoading &&
      tableName &&
      datasourceStructure &&
      datasourceStructure.tables
    ) {
      const templates: QueryTemplate[] | undefined =
        datasourceStructure.tables.find(
          (structure: DatasourceTable) => structure.name === tableName,
        )?.templates;

      if (templates) {
        let suggestedTemPlate: QueryTemplate | undefined = templates?.find(
          (template) => template.suggested,
        );

        // if no suggested template exists, default to first template.
        if (!suggestedTemPlate) {
          suggestedTemPlate = templates[0];
        }

        fetchPreviewData({
          datasourceId: props.datasource.id,
          template: suggestedTemPlate,
        });
      }
    }
  }, [tableName, isDatasourceStructureLoading]);

  useEffect(() => {
    if (previewData && previewData.length > 0) {
      AnalyticsUtil.logEvent("DATASOURCE_PREVIEW_DATA_SHOWN", {
        datasourceId: props.datasource.id,
        pluginId: props.datasource.pluginId,
      });
    }
  }, [previewData]);

  useEffect(() => {
    setPreviewData([]);
  }, [props.datasource.id]);

  const onEntityTableClick = (table: string) => {
    AnalyticsUtil.logEvent("DATASOURCE_PREVIEW_TABLE_CHANGE", {
      datasourceId: props.datasource.id,
      pluginId: props.datasource.pluginId,
    });
    // This sets table name in redux state to be used to create appropriate query
    dispatch(setDatasourcePreviewSelectedTableName(table));
  };

  // custom edit datasource function
  const customEditDatasourceFn = () => {
    props.setDatasourceViewModeFlag(false);
  };

  return (
    <ViewModeSchemaContainer>
      <DataWrapperContainer data-testid="t--datasource-schema-container">
        <StructureContainer>
          {props.datasource && (
            <DatasourceStructureHeader
              datasource={props.datasource}
              paddingBottom
            />
          )}
          <DatasourceListContainer>
            <DatasourceStructureList
              context={DatasourceStructureContext.DATASOURCE_VIEW_MODE}
              customEditDatasourceFn={customEditDatasourceFn}
              datasourceId={props.datasource.id}
              datasourceName={props.datasource.name}
              datasourceStructure={datasourceStructure}
              onEntityTableClick={onEntityTableClick}
              step={0}
              tableName={tableName}
            />
          </DatasourceListContainer>
        </StructureContainer>
        <DatasourceDataContainer>
          <TableWrapper>
            {(isLoading || isDatasourceStructureLoading) && (
              <RenderInterimDataState state="LOADING" />
            )}
            {(!isLoading || !isDatasourceStructureLoading) &&
              (failedFetchingPreviewData || previewDataError) && (
                <RenderInterimDataState state="FAILED" />
              )}
            {!isLoading &&
              !isDatasourceStructureLoading &&
              !failedFetchingPreviewData &&
              !previewDataError &&
              previewData?.length > 0 && (
                <Table data={previewData} shouldResize={false} />
              )}
            {!isLoading &&
              !isDatasourceStructureLoading &&
              !failedFetchingPreviewData &&
              !previewDataError &&
              !previewData?.length && <RenderInterimDataState state="NODATA" />}
          </TableWrapper>
        </DatasourceDataContainer>
      </DataWrapperContainer>
    </ViewModeSchemaContainer>
  );
};

export default DatasourceViewModeSchema;
