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
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const numberOfEntities = useSelector(getNumberOfEntitiesInCurrentPage);
  const currentMode = useRef(
    numberOfEntities > 0
      ? GENERATE_PAGE_MODE.NEW
      : GENERATE_PAGE_MODE.REPLACE_EMPTY,
  );

  //   set first table name
  useEffect(() => {
    if (
      datasourceStructure &&
      !!datasourceStructure.tables &&
      datasourceStructure.tables?.length > 0
    ) {
      setTableName(datasourceStructure.tables[0].name);
    }
  }, []);

  // eslint-disable-next-line no-console
  console.log("heree", setIsLoading, setIsError);

  const displayData = [
    {
      id: 3,
      gender: "male",
      latitude: "-36.032",
      longitude: "-22.1341",
      dob: "1988-07-19T08:59:18.63Z",
    },
    {
      id: 4,
      gender: "female",
      latitude: "-22.1155",
      longitude: "-50.9185",
      dob: "1979-10-24T12:21:54.259Z",
    },
    {
      id: 5,
      gender: "male",
      latitude: "35.1077",
      longitude: "-124.6599",
      dob: "1958-02-04T07:12:09.754Z",
    },
    {
      id: 6,
      gender: "male",
      latitude: "-55.9694",
      longitude: "-168.6133",
      dob: "1995-04-24T19:53:54.211Z",
    },
    {
      id: 8,
      gender: "female",
      latitude: "49.6357",
      longitude: "-175.3",
      dob: "1952-05-19T04:32:02.966Z",
    },
    {
      id: 9,
      gender: "female",
      latitude: "-41.228",
      longitude: "47.2591",
      dob: "1947-10-17T23:15:55.261Z",
    },
    {
      id: 11,
      gender: "male",
      latitude: "-80.8558",
      longitude: "-126.6583",
      dob: "1984-11-27T10:32:17.232Z",
    },
  ];

  const onEntityTableClick = (table: string) => {
    setTableName(table);

    // fetch records.
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
        {!isLoading && !isError && (
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
          {!isLoading && isError && (
            <Text color="var(--ads-color-red-500)">
              {createMessage(GSHEETS_ERR_FETCHING_PREVIEW_DATA)}
            </Text>
          )}
          {!isLoading && displayData?.length > 0 && (
            <Table data={displayData} />
          )}
          {!isLoading && displayData?.length < 1 && (
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
