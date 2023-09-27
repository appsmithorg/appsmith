import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { DatasourceStructureContext } from "../Explorer/Datasources/DatasourceStructure";
import { DatasourceStructureContainer as DatasourceStructureList } from "../Explorer/Datasources/DatasourceStructureContainer";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
  getNumberOfEntitiesInCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import DatasourceStructureHeader from "../Explorer/Datasources/DatasourceStructureHeader";
import { MessageWrapper, TableWrapper } from "../SaaSEditor/GoogleSheetSchema";
import { Spinner, Text, Button } from "design-system";
import {
  DATASOURCE_NO_RECORDS_TO_SHOW,
  GSHEETS_ERR_FETCHING_PREVIEW_DATA,
  GSHEETS_FETCHING_PREVIEW_DATA,
  GSHEETS_GENERATE_PAGE_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import Table from "pages/Editor/QueryEditor/Table";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams } from "react-router";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import {
  getCurrentApplicationId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { GENERATE_PAGE_MODE } from "../GeneratePage/components/GeneratePageForm/GeneratePageForm";
import { useDatasourceQuery } from "./hooks";
import type {
  Datasource,
  DatasourceTable,
  QueryTemplate,
} from "entities/Datasource";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import {
  hasCreateDatasourceActionPermission,
  hasCreatePagePermission,
} from "@appsmith/utils/permissionHelpers";
import type { AppState } from "@appsmith/reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";

const ViewModeSchemaContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const StructureContainer = styled.div`
  height: 100%;
  width: 25%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DatasourceDataContainer = styled.div`
  height: 100%;
  width: 73%;
  display: flex;
  flex-direction: column;
`;

const DatasourceListContainer = styled.div`
  height: 100%;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  div {
    flex-shrink: 0;
  }
  div ~ div {
    flex-grow: 1;
  }
  .t--schema-virtuoso-container {
    height: 100%;
  }
`;

const ButtonContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: flex-end;
`;

type Props = {
  datasourceId: string;
  datasource: Datasource;
  setDatasourceViewModeFlag: (viewMode: boolean) => void;
};

const DatasourceViewModeSchema = (props: Props) => {
  const dispatch = useDispatch();

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, props.datasourceId),
  );

  const isDatasourceStructureLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );

  const pagePermissions = useSelector(getPagePermissions);
  const datasourcePermissions = props.datasource?.userPermissions || [];

  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );
  const canCreatePages = hasCreatePagePermission(userAppPermissions);

  const canCreateDatasourceActions = hasCreateDatasourceActionPermission([
    ...datasourcePermissions,
    ...pagePermissions,
  ]);

  const applicationId: string = useSelector(getCurrentApplicationId);
  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const [tableName, setTableName] = useState("");
  const [previewData, setPreviewData] = useState([]);
  // this error is for when there's an issue with the datasource structure
  const [previewDataError, setPreviewDataError] = useState(false);

  const numberOfEntities = useSelector(getNumberOfEntitiesInCurrentPage);
  const currentMode = useRef(
    numberOfEntities > 0
      ? GENERATE_PAGE_MODE.NEW
      : GENERATE_PAGE_MODE.REPLACE_EMPTY,
  );

  const { failedFetchingPreviewData, fetchPreviewData, isLoading } =
    useDatasourceQuery({ setPreviewData, setPreviewDataError });

  // default table name to first table
  useEffect(() => {
    if (
      datasourceStructure &&
      !!datasourceStructure.tables &&
      datasourceStructure.tables?.length > 0
    ) {
      setTableName(datasourceStructure.tables[0].name);
    }

    // if the datasource structure is loading or undefined or if there's an error in the structure
    // reset the preview data states
    if (
      isDatasourceStructureLoading ||
      !datasourceStructure ||
      (datasourceStructure && datasourceStructure?.error)
    ) {
      setPreviewData([]);
      setPreviewDataError(true);
      setTableName("");
    }
  }, [datasourceStructure, isDatasourceStructureLoading]);

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
          datasourceId: props.datasourceId,
          template: suggestedTemPlate,
        });
      }
    }
  }, [tableName, isDatasourceStructureLoading]);

  useEffect(() => {
    if (previewData && previewData.length > 0) {
      AnalyticsUtil.logEvent("DATASOURCE_PREVIEW_DATA_SHOWN", {
        datasourceId: props.datasourceId,
        pluginId: props.datasource.pluginId,
      });
    }
  }, [previewData]);

  const onEntityTableClick = (table: string) => {
    AnalyticsUtil.logEvent("DATASOURCE_PREVIEW_TABLE_CHANGE", {
      datasourceId: props.datasourceId,
      pluginId: props.datasource.pluginId,
    });
    setTableName(table);
  };

  const generatePageAction = () => {
    if (
      datasourceStructure &&
      datasourceStructure?.tables &&
      datasourceStructure?.tables?.length > 0
    ) {
      const payload = {
        applicationId: applicationId || "",
        pageId:
          currentMode.current === GENERATE_PAGE_MODE.NEW
            ? ""
            : currentPageId || "",
        columns: [],
        searchColumn: "",
        tableName: tableName,
        datasourceId: props.datasourceId || "",
      };

      AnalyticsUtil.logEvent("DATASOURCE_GENERATE_PAGE_BUTTON_CLICKED", {
        datasourceId: props.datasourceId,
        pluginId: props.datasource.pluginId,
      });

      dispatch(generateTemplateToUpdatePage(payload));
    }
  };

  // custom edit datasource function
  const customEditDatasourceFn = () => {
    props.setDatasourceViewModeFlag(false);
  };

  // only show generate button if schema is not being fetched, if the preview data is not being fetched
  // if there was a failure in the fetching of the data
  // if tableName from schema is availble
  // if the user has permissions
  const showGeneratePageBtn =
    !isDatasourceStructureLoading &&
    !isLoading &&
    !failedFetchingPreviewData &&
    tableName &&
    canCreateDatasourceActions &&
    canCreatePages;

  return (
    <ViewModeSchemaContainer>
      <StructureContainer>
        <DatasourceStructureHeader datasourceId={props.datasourceId} />

        <DatasourceListContainer>
          <DatasourceStructureList
            context={DatasourceStructureContext.DATASOURCE_VIEW_MODE}
            customEditDatasourceFn={customEditDatasourceFn}
            datasourceId={props.datasourceId}
            datasourceStructure={datasourceStructure}
            onEntityTableClick={onEntityTableClick}
            step={0}
            tableName={tableName}
          />
        </DatasourceListContainer>
      </StructureContainer>
      <DatasourceDataContainer>
        {showGeneratePageBtn && (
          <ButtonContainer>
            <Button
              className="t--gsheet-generate-page"
              key="gsheet-generate-page"
              kind="primary"
              onClick={generatePageAction}
              size="md"
            >
              {createMessage(GSHEETS_GENERATE_PAGE_BUTTON)}
            </Button>
          </ButtonContainer>
        )}

        <TableWrapper>
          {isLoading && (
            <MessageWrapper>
              <Spinner size="md" />
              <Text style={{ marginLeft: "8px" }}>
                {createMessage(GSHEETS_FETCHING_PREVIEW_DATA)}
              </Text>
            </MessageWrapper>
          )}
          {!isLoading && failedFetchingPreviewData && (
            <Text color="var(--ads-color-red-500)">
              {createMessage(GSHEETS_ERR_FETCHING_PREVIEW_DATA)}
            </Text>
          )}
          {!isLoading &&
            !failedFetchingPreviewData &&
            !previewDataError &&
            previewData?.length > 0 && <Table data={previewData} />}
          {!isLoading &&
            !failedFetchingPreviewData &&
            !previewDataError &&
            previewData?.length < 1 && (
              <MessageWrapper>
                <Text>{createMessage(DATASOURCE_NO_RECORDS_TO_SHOW)}</Text>
              </MessageWrapper>
            )}
          {/* leaving this here in case we decide to show errors from server */}
          {/* {!isLoading && !failedFetchingPreviewData && previewDataError && (
            <MessageWrapper>
              <Text>{previewDataError}</Text>
            </MessageWrapper>
          )} */}
        </TableWrapper>
      </DatasourceDataContainer>
    </ViewModeSchemaContainer>
  );
};

export default DatasourceViewModeSchema;
