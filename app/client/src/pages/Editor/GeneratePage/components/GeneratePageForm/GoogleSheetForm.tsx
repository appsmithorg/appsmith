import type { ReactElement } from "react";
import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getEditorConfig } from "ee/selectors/entitiesSelector";
import type { AppState } from "ee/reducers";
import { fetchPluginFormConfig } from "actions/pluginActions";
import { DROPDOWN_DIMENSION, DEFAULT_DROPDOWN_OPTION } from "../constants";
import { SelectWrapper, Label, Bold } from "./styles";
import type { GeneratePagePayload } from "./types";
import styled from "styled-components";
import type {
  UseSheetListReturn,
  UseSpreadSheetsReturn,
  UseSheetColumnHeadersReturn,
} from "./hooks";
import type { DropdownOption } from "@appsmith/ads-old";
import { getTypographyByKey, Text, TextType } from "@appsmith/ads-old";
import { debounce } from "lodash";
import {
  createMessage,
  GEN_CRUD_TABLE_HEADER_LABEL,
  GEN_CRUD_COLUMN_HEADER_TITLE,
  GEN_CRUD_NO_COLUMNS,
  GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC,
} from "ee/constants/messages";
import { Icon, Option, Select, Input, Tooltip } from "@appsmith/ads";

interface Props {
  googleSheetPluginId: string;
  selectedDatasource: DropdownOption;
  selectedSpreadsheet: DropdownOption;
  generatePageAction: (payload: GeneratePagePayload) => void;
  renderSubmitButton: ({
    disabled,
    isLoading,
    onSubmit,
  }: {
    onSubmit: () => void;
    disabled: boolean;
    isLoading: boolean;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => ReactElement<any, any>;
  sheetsListProps: UseSheetListReturn;
  spreadSheetsProps: UseSpreadSheetsReturn;
  sheetColumnsHeaderProps: UseSheetColumnHeadersReturn;
}

// styles

const RoundBg = styled.div``;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 4px;
`;

const ColumnName = styled.span`
  ${getTypographyByKey("p3")};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ColumnInfoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 24px;
  width: ${DROPDOWN_DIMENSION.WIDTH};
  overflow: hidden;
  flex-wrap: wrap;
  margin-top: 2px;
  .cs-text {
    color: var(--ads-v2-color-fg-muted);
  }
`;

const ColumnNameWrapper = styled.div`
  display: flex;
  color: var(--ads-v2-color-fg-muted);
`;

const RowHeading = styled.p`
  ${getTypographyByKey("p1")};
  margin-right: 6px;
`;

// As TextInput with dataType as number allows `e` as input, hence adding a number validator
// to check for only whole numbers.
export function isNumberValidator(value: string) {
  const isValid = (/^\d+$/.test(value) && Number(value) > 0) || value === "";

  return {
    isValid: isValid,
    message: !isValid ? "Only numeric value allowed" : "",
  };
}

// constants

const MAX_COLUMNS_VISIBLE = 3;

// ---------- GoogleSheetForm Component -------

function GoogleSheetForm(props: Props) {
  const {
    generatePageAction,
    googleSheetPluginId,
    renderSubmitButton,
    selectedDatasource,
    selectedSpreadsheet,
    sheetColumnsHeaderProps,
    sheetsListProps,
    spreadSheetsProps,
  } = props;

  const { fetchSheetsList, isFetchingSheetsList, sheetsList } = sheetsListProps;
  const { fetchAllSpreadsheets } = spreadSheetsProps;
  const {
    columnHeaderList,
    errorFetchingColumnHeaderList,
    fetchColumnHeaderList,
    isFetchingColumnHeaderList,
  } = sheetColumnsHeaderProps;

  const [tableHeaderIndex, setTableHeaderIndex] = useState<string>("1");
  const [selectedSheet, setSelectedSheet] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );
  const dispatch = useDispatch();

  const googleSheetEditorConfig = useSelector((state: AppState) =>
    getEditorConfig(state, googleSheetPluginId),
  );

  const [sheetQueryRequest, setSheetQueryRequest] =
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useState<Record<any, string>>({});

  useEffect(() => {
    // Check if google sheet editor config is fetched.
    // if not, fetch it.

    if (!googleSheetEditorConfig) {
      dispatch(
        fetchPluginFormConfig({
          pluginId: selectedDatasource.data?.pluginId,
        }),
      );
    }
  }, [googleSheetEditorConfig]);

  useEffect(() => {
    if (googleSheetEditorConfig && googleSheetEditorConfig[0]) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestObject: Record<any, string> = {};
      const configs = googleSheetEditorConfig[0]?.children;

      if (Array.isArray(configs)) {
        for (let index = 0; index < configs.length; index += 2) {
          const keyConfig = configs[index];
          const valueConfig = configs[index + 1];

          if (keyConfig && valueConfig) {
            const key = keyConfig?.initialValue;
            const value = valueConfig?.initialValue;

            if (key && value !== undefined) requestObject[key] = value;
          }
        }
      }

      setSheetQueryRequest(requestObject);
    }
  }, [googleSheetEditorConfig]);

  useEffect(() => {
    // On change of datasource selection
    // if googleSheetEditorConfig if fetched then get all spreadsheets
    if (
      selectedDatasource.value &&
      selectedDatasource.id &&
      googleSheetEditorConfig
    ) {
      fetchAllSpreadsheets({
        selectedDatasourceId: selectedDatasource.id,
        pluginId: selectedDatasource?.data?.pluginId,
        requestObject: sheetQueryRequest,
      });
    }
  }, [selectedDatasource.value, googleSheetEditorConfig, dispatch]);

  // When user selects a spreadsheet
  // Fetch all sheets inside that spreadsheet
  useEffect(() => {
    if (
      selectedDatasource.value &&
      selectedDatasource.id &&
      selectedSpreadsheet.value
    ) {
      setSelectedSheet(DEFAULT_DROPDOWN_OPTION);
      fetchSheetsList({
        requestObject: sheetQueryRequest,
        selectedDatasourceId: selectedDatasource.id,
        selectedSpreadsheetUrl: selectedSpreadsheet.value,
        pluginId: selectedDatasource?.data?.pluginId,
      });
    }
  }, [
    selectedSpreadsheet.value,
    selectedDatasource.id,
    selectedDatasource.value,
    dispatch,
    fetchSheetsList,
  ]);

  const onSelectSheetOption = (
    sheetValue: string | undefined,
    sheetObj: DropdownOption | undefined,
  ) => {
    if (sheetValue && sheetObj) {
      setSelectedSheet(sheetObj);

      if (selectedDatasource.id && selectedSpreadsheet.value) {
        fetchColumnHeaderList({
          selectedDatasourceId: selectedDatasource.id,
          selectedSpreadsheetUrl: selectedSpreadsheet.value,
          sheetName: sheetValue,
          tableHeaderIndex,
          pluginId: selectedDatasource?.data?.pluginId,
          requestObject: sheetQueryRequest,
        });
      }
    }
  };

  const onSubmit = () => {
    if (selectedSpreadsheet.value) {
      const columns: string[] = [];

      columnHeaderList.forEach(({ value }) => {
        if (value) columns.push(value);
      });
      const payload = {
        columns,
        searchColumn: "",
        tableName: selectedSheet.value || "",
        pluginSpecificParams: {
          sheetUrl: selectedSpreadsheet.value,
          tableHeaderIndex,
          sheetName: selectedSheet.value,
        },
      };

      generatePageAction(payload);
    }
  };

  const debouncedFetchColumns = useCallback(
    debounce((value: string) => {
      if (
        selectedDatasource.id &&
        selectedSpreadsheet.value &&
        selectedSheet.value
      ) {
        fetchColumnHeaderList({
          selectedDatasourceId: selectedDatasource.id,
          selectedSpreadsheetUrl: selectedSpreadsheet.value,
          pluginId: selectedDatasource?.data?.pluginId,
          sheetName: selectedSheet.value,
          tableHeaderIndex: value,
          requestObject: sheetQueryRequest,
        });
      }
    }, 200),
    [selectedSheet, selectedDatasource, selectedSheet],
  );

  const tableHeaderIndexChangeHandler = (value: string) => {
    if (isNumberValidator(value).isValid) {
      setTableHeaderIndex(value);
      debouncedFetchColumns(value);
    }
  };

  return (
    <>
      {selectedSpreadsheet.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select sheet from&nbsp;<Bold>{selectedSpreadsheet.label}</Bold>
          </Label>

          <Select
            data-testid="t--sheetName-dropdown"
            isLoading={isFetchingSheetsList}
            onChange={(value) =>
              onSelectSheetOption(
                value,
                sheetsList.find((sheet) => sheet.value === value),
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
      ) : null}

      {selectedSheet.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <>
            <Row>
              <RowHeading>
                {createMessage(GEN_CRUD_TABLE_HEADER_LABEL)}
              </RowHeading>
              <Tooltip
                content={createMessage(GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC)}
                // hoverOpenDelay={200}
              >
                <RoundBg>
                  <Icon name="question-line" size="md" />
                </RoundBg>
              </Tooltip>
            </Row>
            <Input
              data-testid="t--tableHeaderIndex"
              onChange={tableHeaderIndexChangeHandler}
              placeholder="Table header index"
              size="md"
              type="text"
              value={tableHeaderIndex}
            />
            <ColumnInfoWrapper>
              {columnHeaderList.length ? (
                <>
                  <Text type={TextType.P3}>
                    {createMessage(GEN_CRUD_COLUMN_HEADER_TITLE)}:&nbsp;
                  </Text>
                  {columnHeaderList
                    .slice(0, MAX_COLUMNS_VISIBLE)
                    .map((column, index) => (
                      <ColumnNameWrapper key={column.id}>
                        <ColumnName>{column.label}</ColumnName>
                        {columnHeaderList.length - 1 === index ? null : (
                          <ColumnName>,&nbsp;</ColumnName>
                        )}
                      </ColumnNameWrapper>
                    ))}
                  {columnHeaderList.length > MAX_COLUMNS_VISIBLE ? (
                    <ColumnName>
                      and +{columnHeaderList.length - MAX_COLUMNS_VISIBLE} more.
                    </ColumnName>
                  ) : (
                    ""
                  )}
                </>
              ) : (
                <ColumnName>{createMessage(GEN_CRUD_NO_COLUMNS)}</ColumnName>
              )}
            </ColumnInfoWrapper>
          </>
        </SelectWrapper>
      ) : null}

      {selectedSheet.value
        ? renderSubmitButton({
            onSubmit,
            disabled:
              !columnHeaderList.length ||
              isFetchingColumnHeaderList ||
              !!errorFetchingColumnHeaderList,
            isLoading: isFetchingColumnHeaderList,
          })
        : null}
    </>
  );
}

export default GoogleSheetForm;
