import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DropdownOption } from "design-system-old";
import { Button, Option, Select, Spinner, Text } from "design-system";
import {
  useSheetData,
  useSheetsList,
  useSpreadSheets,
} from "../GeneratePage/components/GeneratePageForm/hooks";
import type {
  DatasourceTableDropdownOption,
  DropdownOptions,
} from "../GeneratePage/components/constants";
import {
  DEFAULT_DROPDOWN_OPTION,
  DROPDOWN_DIMENSION,
} from "../GeneratePage/components/constants";
import { SelectWrapper } from "../GeneratePage/components/GeneratePageForm/styles";
import { isEmpty } from "lodash";
import Table from "pages/Editor/QueryEditor/Table";
import styled from "styled-components";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import {
  createMessage,
  GSHEETS_CREATE_LIST_AND_DETAIL,
  GSHEETS_ERR_FETCHING_PREVIEW_DATA,
  GSHEETS_FETCHING_PREVIEW_DATA,
} from "@appsmith/constants/messages";

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  && > div {
    width: fit-content;
  }

  && > ${LoadingWrapper} {
    width: 100%;
  }
  && > div > div {
    border: none;
  }
  & .table {
    background: none;
  }
  & .table div:first-of-type .tr {
    background: var(--ads-v2-color-black-5);
    border-right: none;
    border-bottom: 1px solid var(--ads-v2-color-black-75);
  }
  && .table div.tbody .tr {
    background: var(--ads-v2-color-white);
    border-bottom: 1px solid var(--ads-v2-color-black-75);
  }
  && .table .td,
  && .table .th {
    border-right: none;
    border-bottom: none;
  }
  button {
    margin-right: 24px;
  }
`;

const SelectContainer = styled.div`
  display: flex;
  margin-top: 16px;
  margin-bottom: 16px;
  .t--create-list-and-detail {
    align-self: flex-end;
    margin-left: auto;
  }
`;

const SelectListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 278px;
  margin-right: 16px;
  & div {
    margin-bottom: 0px;
  }
`;

type Props = {
  datasourceId: string;
  pluginId?: string;
};

const MAX_SHEET_ROWS_LENGTH = 12;

// ---------- GoogleSheetSchema Component -------

function GoogleSheetSchema(props: Props) {
  const [datasourceTableOptions, setSelectedDatasourceTableOptions] =
    useState<DropdownOptions>([]);
  const [selectedDatasourceIsInvalid, setSelectedDatasourceIsInvalid] =
    useState(false);
  const { fetchAllSpreadsheets, isFetchingSpreadsheets } = useSpreadSheets({
    setSelectedDatasourceTableOptions,
    setSelectedDatasourceIsInvalid,
  });
  const {
    failedFetchingSheetsList,
    fetchSheetsList,
    isFetchingSheetsList,
    sheetsList,
  } = useSheetsList();
  const { fetchSheetData, isFetchingSheetData, sheetData } = useSheetData();
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<DropdownOption>({});
  const [selectedSheet, setSelectedSheet] = useState<DropdownOption>({});
  const [currentSheetData, setCurrentSheetData] = useState<any>();
  const applicationId: string = useSelector(getCurrentApplicationId);

  const dispatch = useDispatch();

  // Fetch spreadsheets if datasourceId present
  useEffect(() => {
    if (!!props.datasourceId && !!props.pluginId) {
      fetchAllSpreadsheets({
        selectedDatasourceId: props.datasourceId,
        pluginId: props.pluginId || "",
        requestObject: {},
      });
    }
  }, [props.datasourceId, props.pluginId, dispatch]);

  // When user selects a spreadsheet
  // Fetch all sheets inside that spreadsheet
  useEffect(() => {
    if (!!props.datasourceId && !!props.pluginId && selectedSpreadsheet.value) {
      setSelectedSheet(DEFAULT_DROPDOWN_OPTION);
      setCurrentSheetData(undefined);
      fetchSheetsList({
        requestObject: {},
        selectedDatasourceId: props.datasourceId,
        selectedSpreadsheetUrl: selectedSpreadsheet.value,
        pluginId: props.pluginId,
      });
    }
  }, [
    selectedSpreadsheet.value,
    props.datasourceId,
    props.pluginId,
    dispatch,
    fetchSheetsList,
  ]);

  // When user selects a sheet name
  // Fetch all sheet data inside that sheet
  useEffect(() => {
    if (!!props.datasourceId && !!props.pluginId && selectedSheet.value) {
      setCurrentSheetData(undefined);
      fetchSheetData({
        selectedDatasourceId: props.datasourceId,
        selectedSpreadsheetUrl: selectedSpreadsheet.value || "",
        selectedSheetName: selectedSheet.value,
        pluginId: props.pluginId || "",
      });
    }
  }, [
    selectedSheet.value,
    props.datasourceId,
    props.pluginId,
    dispatch,
    fetchSheetData,
  ]);

  // Set first spreadsheet as default option in the dropdown
  useEffect(() => {
    if (
      datasourceTableOptions?.length > 0 &&
      isEmpty(selectedSpreadsheet.value)
    ) {
      setSelectedSpreadsheet(datasourceTableOptions[0]);
    }
  }, [selectedSpreadsheet, datasourceTableOptions]);

  // Set first sheet as default option in the dropdown
  useEffect(() => {
    if (
      sheetsList?.length > 0 &&
      isEmpty(selectedSheet.value) &&
      !isFetchingSheetsList
    ) {
      setSelectedSheet(sheetsList[0]);
    }
  }, [selectedSheet, sheetsList, isFetchingSheetsList]);

  // Set current sheet data
  useEffect(() => {
    if (sheetData?.length > 0) {
      // Getting the top 12 rows as for experimentation we need to keep this number fixed for preview
      setCurrentSheetData(sheetData.slice(0, MAX_SHEET_ROWS_LENGTH));
    }
  }, [sheetData]);

  const onSelectSpreadsheet = (
    table: string | undefined,
    TableObj: DatasourceTableDropdownOption | undefined,
  ) => {
    if (table && TableObj) {
      setSelectedSpreadsheet(TableObj);
    }
  };

  const onSelectSheetOption = (
    sheetValue: string | undefined,
    sheetObj: DropdownOption | undefined,
  ) => {
    if (sheetValue && sheetObj) {
      setSelectedSheet(sheetObj);
    }
  };

  const isError = selectedDatasourceIsInvalid || failedFetchingSheetsList;
  const isLoading =
    isFetchingSpreadsheets ||
    isFetchingSheetsList ||
    isFetchingSheetData ||
    (!isError && !currentSheetData);

  const onCreateListandDetail = () => {
    const payload = {
      applicationId: applicationId || "",
      pageId: "",
      columns:
        !!currentSheetData && currentSheetData.length > 0
          ? Object.keys(currentSheetData[0])
          : [],
      searchColumn: "",
      tableName: selectedSheet?.value || "",
      datasourceId: props.datasourceId || "",
      pluginSpecificParams: {
        sheetName: selectedSheet?.value || "",
        sheetUrl: selectedSpreadsheet?.value || "",
        tableHeaderIndex: 1,
      },
    };

    dispatch(generateTemplateToUpdatePage(payload));
  };

  return (
    <>
      <SelectContainer>
        {!!props.datasourceId ? (
          <SelectListWrapper>
            <Text>Spreadsheet</Text>
            <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
              <Select
                data-testid="t--table-dropdown"
                isLoading={isFetchingSpreadsheets}
                onChange={(value: any) =>
                  onSelectSpreadsheet(
                    value,
                    datasourceTableOptions.find(
                      (table) => table.value === value,
                    ) as DatasourceTableDropdownOption,
                  )
                }
                value={selectedSpreadsheet}
              >
                {datasourceTableOptions.map((table) => {
                  return (
                    <Option key={table.value} value={table.value}>
                      {table.label}
                    </Option>
                  );
                })}
              </Select>
            </SelectWrapper>
          </SelectListWrapper>
        ) : null}
        {selectedSpreadsheet.value ? (
          <SelectListWrapper>
            <Text>Sheet</Text>
            <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
              <Select
                data-testid="t--sheetName-dropdown"
                isLoading={isFetchingSheetsList}
                onChange={(value: any) =>
                  onSelectSheetOption(
                    value,
                    sheetsList.find(
                      (sheet: DropdownOption) => sheet.value === value,
                    ),
                  )
                }
                value={selectedSheet}
              >
                {sheetsList.map((sheet) => {
                  return (
                    <Option key={sheet.label} value={sheet.label}>
                      {sheet?.label}
                    </Option>
                  );
                })}
              </Select>
            </SelectWrapper>
          </SelectListWrapper>
        ) : null}
        {!isLoading && !isError && currentSheetData && (
          <Button
            className="t--create-list-and-detail"
            key="create-list-and-detail"
            kind="primary"
            onClick={onCreateListandDetail}
            size="md"
          >
            {createMessage(GSHEETS_CREATE_LIST_AND_DETAIL)}
          </Button>
        )}
      </SelectContainer>
      <TableWrapper>
        {isLoading ? (
          <LoadingWrapper>
            <Spinner size="md" />
            <Text style={{ marginLeft: "8px" }}>
              {createMessage(GSHEETS_FETCHING_PREVIEW_DATA)}
            </Text>
          </LoadingWrapper>
        ) : isError ? (
          <Text color="var(--ads-color-red-500)">
            {createMessage(GSHEETS_ERR_FETCHING_PREVIEW_DATA)}
          </Text>
        ) : currentSheetData ? (
          <Table data={currentSheetData} />
        ) : null}
      </TableWrapper>
    </>
  );
}

export default GoogleSheetSchema;
