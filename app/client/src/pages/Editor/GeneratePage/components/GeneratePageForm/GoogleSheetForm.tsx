import React, { useState, useEffect, ReactElement } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getEditorConfig } from "selectors/entitiesSelector";
import { AppState } from "reducers/index";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { fetchPluginFormConfig } from "actions/pluginActions";
import { DROPDOWN_DIMENSION, DEFAULT_DROPDOWN_OPTION } from "../constants";
import { SelectWrapper, Label, Bold } from "./styles";
import TextInput from "components/ads/TextInput";
import { GeneratePagePayload } from "./types";
import { getSheetUrl } from "./hooks";
import Tooltip from "components/ads/Tooltip";
import styled from "styled-components";
import {
  UseSheetListReturn,
  UseSpreadSheetsReturn,
  UseSheetColumnHeadersReturn,
} from "./hooks";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";

type Props = {
  googleSheetPluginId: string;
  selectedDatasource: DropdownOption;
  selectedSpreadsheet: DropdownOption;
  generatePageAction: (payload: GeneratePagePayload) => void;
  renderSubmitButton: ({
    disabled,
    onSubmit,
  }: {
    onSubmit: () => void;
    disabled: boolean;
  }) => ReactElement<any, any>;
  sheetsListProps: UseSheetListReturn;
  spreadSheetsProps: UseSpreadSheetsReturn;
  sheetColumnsHeaderProps: UseSheetColumnHeadersReturn;
};

// styles

const RoundBg = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 16px;
  background-color: ${Colors.GRAY};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const ColumnName = styled.span`
  ${(props) => `${getTypographyByKey(props, "p3")}`};
  color: ${Colors.GRAY};
`;

const ColumnNameWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 0px 8px;
  margin-bottom: 10px;
  width: ${DROPDOWN_DIMENSION.WIDTH};
  overflow: hidden;
`;

const TooltipWrapper = styled.div`
  margin-top: 2px;
`;

const RowHeading = styled.p`
  ${(props) => `${getTypographyByKey(props, "p1")}`};
  margin-right: 10px;
`;

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
    // On change of datasource selection
    // if googleSheetEditorConfig if fetched then get all spreadsheets
    if (
      selectedDatasource.value &&
      selectedDatasource.id &&
      googleSheetEditorConfig
    ) {
      fetchAllSpreadsheets({ selectedDatasourceId: selectedDatasource.id });
    }
  }, [selectedDatasource.value, googleSheetEditorConfig, dispatch]);

  // When user selects a spreadsheet
  // Fetch all sheets inside that spreadsheet
  useEffect(() => {
    if (
      selectedDatasource.value &&
      selectedDatasource.id &&
      selectedSpreadsheet.value &&
      selectedSpreadsheet.id
    ) {
      setSelectedSheet(DEFAULT_DROPDOWN_OPTION);
      fetchSheetsList({
        selectedDatasourceId: selectedDatasource.id,
        selectedSpreadsheetId: selectedSpreadsheet.id,
      });
    }
  }, [
    selectedSpreadsheet.id,
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
      if (selectedDatasource.id && selectedSpreadsheet.id) {
        fetchColumnHeaderList({
          selectedDatasourceId: selectedDatasource.id,
          selectedSpreadsheetId: selectedSpreadsheet.id,
          sheetName: sheetValue,
          tableHeaderIndex,
        });
      }
    }
  };

  const onSubmit = () => {
    if (selectedSpreadsheet.id) {
      const columns: string[] = [];
      columnHeaderList.forEach(({ value }) => {
        if (value) columns.push(value);
      });
      const payload = {
        columns,
        searchColumn: "",
        tableName: selectedSpreadsheet.value || "",
        pluginSpecificParams: {
          sheetUrl: getSheetUrl(selectedSpreadsheet.id),
          tableHeaderIndex,
          sheetName: selectedSheet.value,
        },
      };
      generatePageAction(payload);
    }
  };

  const tableHeaderIndexChangeHandler = (value: string) => {
    if (
      selectedDatasource.id &&
      selectedSpreadsheet.id &&
      selectedSheet.value &&
      value !== "0"
    ) {
      setTableHeaderIndex(value);
      fetchColumnHeaderList({
        selectedDatasourceId: selectedDatasource.id,
        selectedSpreadsheetId: selectedSpreadsheet.id,
        sheetName: selectedSheet.value,
        tableHeaderIndex: value,
      });
    }
  };

  return (
    <>
      {selectedSpreadsheet.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select sheet from <Bold>{selectedSpreadsheet.label}</Bold>
          </Label>
          <Dropdown
            cypressSelector="t--table-dropdown"
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            isLoading={isFetchingSheetsList}
            onSelect={onSelectSheetOption}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={sheetsList}
            selected={selectedSheet}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      ) : null}

      {selectedSheet.value ? (
        <>
          <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
            <Row>
              <RowHeading>Table Header Index </RowHeading>
              <TooltipWrapper>
                <Tooltip
                  content="Row index of the column headers in the sheet table"
                  hoverOpenDelay={200}
                >
                  <RoundBg>
                    <Icon
                      fillColor={Colors.WHITE}
                      hoverFillColor={Colors.WHITE}
                      name="help"
                      size={IconSize.XXS}
                    />
                  </RoundBg>
                </Tooltip>
              </TooltipWrapper>
            </Row>

            <TextInput
              dataType="number"
              defaultValue={tableHeaderIndex}
              fill
              onChange={tableHeaderIndexChangeHandler}
              placeholder="Table Header Index"
            />
          </SelectWrapper>
          <ColumnNameWrapper>
            {columnHeaderList.length ? (
              columnHeaderList.map((column, index) => (
                <div key={column.id}>
                  <ColumnName>{column.label}</ColumnName>
                  {columnHeaderList.length === index - 1 ? null : (
                    <ColumnName>,&nbsp;</ColumnName>
                  )}
                </div>
              ))
            ) : (
              <div>
                <ColumnName>No columns found</ColumnName>
              </div>
            )}
          </ColumnNameWrapper>
        </>
      ) : null}

      {selectedSheet.value && columnHeaderList.length
        ? renderSubmitButton({ onSubmit, disabled: !columnHeaderList.length })
        : null}
    </>
  );
}

export default GoogleSheetForm;
