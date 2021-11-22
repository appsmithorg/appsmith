import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { Bold, Label, SelectWrapper } from "../styles";
import Button, { Category, Size } from "components/ads/Button";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import Tooltip from "components/ads/Tooltip";
import { DEFAULT_DROPDOWN_OPTION, DROPDOWN_DIMENSION } from "../constants";
import { DatasourceTableDropdownOption } from "../types";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../../../../Explorer/helpers";
import history from "utils/history";

const RoundBg = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 16px;
  background-color: ${Colors.GRAY};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TooltipWrapper = styled.div`
  margin-top: 2px;
  margin-left: 6px;
`;

const Row = styled.p`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  white-space: nowrap;
`;

const FormSubmitButton = styled(Button)<{ disabled?: boolean }>`
  ${(props) => getTypographyByKey(props, "btnLarge")};
  color: ${Colors.DOVE_GRAY2};
  margin: 10px 0px;
`;

const EditDatasourceButton = styled(Button)`
  margin-top: 30px;
`;

function GeneratePageSubmitBtn({
  disabled,
  isLoading,
  onSubmit,
  showSubmitButton,
}: {
  onSubmit: () => void;
  isLoading: boolean;
  showSubmitButton: boolean;
  disabled: boolean;
}) {
  return showSubmitButton ? (
    <FormSubmitButton
      category={Category.tertiary}
      data-cy="t--generate-page-form-submit"
      disabled={disabled}
      isLoading={isLoading}
      onClick={() => !disabled && onSubmit()}
      size={Size.large}
      text="Generate Page"
      type="button"
    />
  ) : null;
}

type Props = {
  generatePageAction: (payload: unknown) => void;
  pluginField: { TABLE: string; COLUMN: string };
  selectedDatasource: any;
};

function SQLForm(props: Props) {
  const applicationId = useSelector(getCurrentApplicationId);
  const { pageId: currentPageId } = useParams<ExplorerURLParams>();
  const [isSelectedTableEmpty, setIsSelectedTableEmpty] = useState<boolean>(
    false,
  );

  const [selectedTable, selectTable] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const [selectedColumn, selectColumn] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  // onSelectDataSource
  // selectTable(DEFAULT_DROPDOWN_OPTION);
  // selectColumn(DEFAULT_DROPDOWN_OPTION);

  const onSelectTable = useCallback(
    (table: string | undefined, TableObj: DatasourceTableDropdownOption) => {
      if (table && TableObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_TABLE");
        selectTable(TableObj);
        selectColumn(DEFAULT_DROPDOWN_OPTION);
        // if (!isGoogleSheetPlugin && !isS3Plugin) {
        //   const { data } = TableObj;

        //   if (Array.isArray(data.columns)) {
        //     if (data.columns.length === 0) setIsSelectedTableEmpty(true);
        //     else {
        //       if (isSelectedTableEmpty) setIsSelectedTableEmpty(false);
        //       const newSelectedTableColumnOptions: DropdownOption[] = [];
        //       data.columns.map((column) => {
        //         if (
        //           column.type &&
        //           ALLOWED_SEARCH_DATATYPE.includes(column.type.toLowerCase())
        //         ) {
        //           newSelectedTableColumnOptions.push({
        //             id: column.name,
        //             label: column.name,
        //             value: column.name,
        //             subText: column.type,
        //             icon: columnIcon,
        //             iconSize: IconSize.LARGE,
        //             iconColor: Colors.GOLD,
        //           });
        //         }
        //       });
        //       setSelectedTableColumnOptions(newSelectedTableColumnOptions);
        //     }
        //   } else {
        //     setSelectedTableColumnOptions([]);
        //   }
        // }
      }
    },
    [
      isSelectedTableEmpty,
      selectTable,
      // setSelectedTableColumnOptions,
      selectColumn,
      setIsSelectedTableEmpty,
      // isGoogleSheetPlugin,
      // isS3Plugin,
    ],
  );

  const onSelectColumn = useCallback(
    (table: string | undefined, ColumnObj: DropdownOption | undefined) => {
      if (table && ColumnObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_SEARCH_COLUMN");
        selectColumn(ColumnObj);
      }
    },
    [selectColumn],
  );

  const handleFormSubmit = () => {
    const payload = {
      columns: [],
      searchColumn: selectedColumn.value,
      tableName: selectedTable.value || "",
    };
    props.generatePageAction(payload);
  };

  const pluginField: {
    TABLE: string;
    COLUMN: string;
  } = props.pluginField;

  const tableDropdownErrorMsg = "";

  // const fetchingDatasourceConfigs =
  //   isFetchingDatasourceStructure ||
  //   (isFetchingBucketList && isS3Plugin) ||
  //   ((isFetchingSheetPluginForm || spreadSheetsProps.isFetchingSpreadsheets) &&
  //     isGoogleSheetPlugin);

  // const fetchingDatasourceConfigError =
  //   selectedDatasourceIsInvalid ||
  //   !isValidDatasourceConfig ||
  //   (failedFetchingBucketList && isS3Plugin);

  // if (!fetchingDatasourceConfigs) {
  //   if (datasourceTableOptions.length === 0) {
  //     tableDropdownErrorMsg = `Couldn't find any ${pluginField.TABLE}, Please select another datasource`;
  //   }
  //   if (fetchingDatasourceConfigError) {
  //     tableDropdownErrorMsg = `Failed fetching datasource structure, Please check your datasource configuration`;
  //   }
  //   if (isSelectedTableEmpty) {
  //     tableDropdownErrorMsg = `Couldn't find any columns, Please select table with columns.`;
  //   }
  // }

  const goToEditDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_EDIT_DATASOURCE_CONFIG", {
      datasourceId: props.selectedDatasource.id,
    });
    const redirectURL = DATA_SOURCES_EDITOR_ID_URL(
      applicationId,
      currentPageId,
      props.selectedDatasource.id,
      { isGeneratePageMode: "generate-page" },
    );
    history.push(redirectURL);
  };

  // if the datasource has basic information to connect to db it is considered as a valid structure hence isValid true.
  // const isValidDatasourceConfig = props.selectedDatasource.data?.isValid;

  // const showEditDatasourceBtn =
  //   !isFetchingDatasourceStructure &&
  //   (selectedDatasourceIsInvalid || !isValidDatasourceConfig) &&
  //   !!props.selectedDatasource.value;

  return (
    <>
      {props.selectedDatasource.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select {pluginField.TABLE} from{" "}
            <Bold>{props.selectedDatasource.label}</Bold>
          </Label>
          <Dropdown
            cypressSelector="t--table-dropdown"
            dropdownMaxHeight={"300px"}
            errorMsg={tableDropdownErrorMsg}
            height={DROPDOWN_DIMENSION.HEIGHT}
            // isLoading={fetchingDatasourceConfigs}
            onSelect={onSelectTable}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={datasourceTableOptions}
            selected={selectedTable}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      ) : null}
      {/* {showEditDatasourceBtn && (
        <EditDatasourceButton
          category={Category.tertiary}
          onClick={goToEditDatasource}
          size={Size.medium}
          text="Edit Datasource"
          type="button"
        />
      )} */}
      <>
        {showSearchableColumn && (
          <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
            <Row>
              Select a searchable {pluginField.COLUMN} from the selected&nbsp;
              {pluginField.TABLE}
              <TooltipWrapper>
                <Tooltip
                  content="Only string values are allowed for searchable column"
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
            <Dropdown
              cypressSelector="t--searchColumn-dropdown"
              disabled={selectedTableColumnOptions.length === 0}
              dropdownMaxHeight={"300px"}
              helperText={
                selectedTableColumnOptions.length === 0
                  ? `* Optional (No searchable ${pluginField.COLUMN} to select)`
                  : "* Optional"
              }
              onSelect={onSelectColumn}
              optionWidth={DROPDOWN_DIMENSION.WIDTH}
              options={selectedTableColumnOptions}
              selected={selectedColumn}
              showLabelOnly
              width={DROPDOWN_DIMENSION.WIDTH}
            />
          </SelectWrapper>
        )}
        <GeneratePageSubmitBtn
          disabled={submitButtonDisable}
          isLoading={!!isGeneratingTemplatePage}
          onSubmit={handleFormSubmit}
          showSubmitButton={!!showSubmitButton}
        />
      </>
    </>
  );
}

export default SQLForm;
