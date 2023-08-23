import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  DatasourceStructureContainer as DatasourceStructureList,
  DatasourceStructureContext,
} from "../Explorer/Datasources/DatasourceStructureContainer";
import {
  getDatasourceStructureById,
  getNumberOfEntitiesInCurrentPage,
} from "selectors/entitiesSelector";
import DatasourceStructureHeader from "../Explorer/Datasources/DatasourceStructureHeader";
import { MessageWrapper, TableWrapper } from "../SaaSEditor/GoogleSheetSchema";
import { Spinner, Text, Button } from "design-system";
import {
  DATASOURCE_LIST_AND_DETAIL_PAGE,
  DATASOURCE_NO_RECORDS_TO_SHOW,
  GSHEETS_ERR_FETCHING_PREVIEW_DATA,
  GSHEETS_FETCHING_PREVIEW_DATA,
  createMessage,
} from "@appsmith/constants/messages";
import Table from "pages/Editor/QueryEditor/Table";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams } from "react-router";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { ExplorerURLParams } from "ce/pages/Editor/Explorer/helpers";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { GENERATE_PAGE_MODE } from "../GeneratePage/components/GeneratePageForm/GeneratePageForm";
import { useDatasourceQuery } from "./hooks";

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
  overflow: scroll;
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
`;

const ButtonContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: flex-end;
`;

type Props = {
  datasourceId: string;
};

const DatasourceViewModeSchema = (props: Props) => {
  const dispatch = useDispatch();

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, props.datasourceId),
  );

  const applicationId: string = useSelector(getCurrentApplicationId);
  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const [tableName, setTableName] = useState("");
  const [previewData, setPreviewData] = useState([]);
  // leaving this here if we ever want to show error from server
  // const [previewDataError, setPreviewDataError] = useState(false);

  const numberOfEntities = useSelector(getNumberOfEntitiesInCurrentPage);
  const currentMode = useRef(
    numberOfEntities > 0
      ? GENERATE_PAGE_MODE.NEW
      : GENERATE_PAGE_MODE.REPLACE_EMPTY,
  );

  const { failedFetchingPreviewData, fetchPreviewData, isLoading } =
    useDatasourceQuery({ setPreviewData });

  // default table name to first table
  useEffect(() => {
    if (
      datasourceStructure &&
      !!datasourceStructure.tables &&
      datasourceStructure.tables?.length > 0
    ) {
      setTableName(datasourceStructure.tables[0].name);
    }
  }, [datasourceStructure]);

  // this fetches the preview data when the table name changes
  useEffect(() => {
    if (tableName && datasourceStructure && datasourceStructure.tables) {
      const templates = datasourceStructure.tables.find(
        (structure) => structure.name === tableName,
      )?.templates;
      if (templates) {
        fetchPreviewData({
          datasourceId: props.datasourceId,
          template: templates[0],
        });
      }
    }
  }, [tableName]);

  const onEntityTableClick = (table: string) => {
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
        searchColumn: datasourceStructure?.tables[0].columns[0].name || "",
        tableName: tableName,
        datasourceId: props.datasourceId || "",
      };

      dispatch(generateTemplateToUpdatePage(payload));
    }
  };

  return (
    <ViewModeSchemaContainer>
      <StructureContainer>
        <DatasourceStructureHeader datasourceId={props.datasourceId} />

        <DatasourceListContainer>
          <DatasourceStructureList
            context={DatasourceStructureContext.DATASOURCE_VIEW_MODE}
            datasourceId={props.datasourceId}
            datasourceStructure={datasourceStructure}
            onEntityTableClick={onEntityTableClick}
            step={0}
            tableName={tableName}
          />
        </DatasourceListContainer>
      </StructureContainer>
      <DatasourceDataContainer>
        {!isLoading && !failedFetchingPreviewData && (
          <ButtonContainer>
            <Button
              className="t--gsheet-generate-page"
              key="gsheet-generate-page"
              kind="primary"
              onClick={generatePageAction}
              size="md"
            >
              {createMessage(DATASOURCE_LIST_AND_DETAIL_PAGE)}
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
            previewData?.length > 0 && <Table data={previewData} />}
          {!isLoading &&
            !failedFetchingPreviewData &&
            previewData?.length < 1 && (
              <MessageWrapper>
                <Text>{DATASOURCE_NO_RECORDS_TO_SHOW}</Text>
              </MessageWrapper>
            )}
        </TableWrapper>
      </DatasourceDataContainer>
    </ViewModeSchemaContainer>
  );
};

export default DatasourceViewModeSchema;
