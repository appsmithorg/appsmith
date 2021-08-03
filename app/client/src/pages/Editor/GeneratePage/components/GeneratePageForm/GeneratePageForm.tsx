import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { getTypographyByKey } from "../../../../../constants/DefaultTheme";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector, useDispatch } from "react-redux";
import {
  getDatasources,
  getIsFetchingDatasourceStructure,
} from "../../../../../selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";
import { fetchDatasourceStructure } from "../../../../../actions/datasourceActions";
import { getDatasourcesStructure } from "selectors/entitiesSelector";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams, useLocation } from "react-router";
import { ExplorerURLParams } from "../../../Explorer/helpers";
import {
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
  DATA_SOURCES_EDITOR_ID_URL,
} from "constants/routes";
import history from "utils/history";
import { getQueryParams } from "utils/AppsmithUtils";
import { getIsGeneratingTemplatePage } from "selectors/pageListSelectors";
import DataSourceOption from "../DataSourceOption";
import { convertToQueryParams } from "constants/routes";
import { IconName, IconSize } from "components/ads/Icon";
import GoogleSheetForm from "../GoogleSheetForm";
import { GENERATE_PAGE_FORM_TITLE } from "../../../../../constants/messages";
import { GenerateCRUDEnabledPluginMap } from "../../../../../api/PluginApi";
import { getGenerateCRUDEnabledPluginMap } from "../../../../../selectors/entitiesSelector";
import { useDatasourceOptions } from "./hooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  DropdownOptions,
  DatasourceTableDropdownOption,
  PluginFormInputFieldMap,
  PLUGIN_PACKAGE_NAME,
} from "../constants";

const DROPDOWN_DIMENSION = {
  HEIGHT: "36px",
  WIDTH: "404px",
};

const DEFAULT_DROPDOWN_OPTION = {
  id: "- Select -",
  label: "- Select -",
  value: "",
  onSelect: () => null,
  data: {},
};

const ALLOWED_SEARCH_DATATYPE = [
  "text",
  "string",
  "char",
  "varchar",
  "character",
  "text string",
];
//  ---------- Styles ----------

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 20px 0px;
  border: none;
`;

const SelectWrapper = styled.div`
  margin: 10px;
`;

const Label = styled.p`
  ${(props) => `${getTypographyByKey(props, "p1")}`}
`;

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const FormSubmitButton = styled(Button)<{ disabled?: boolean }>`
  ${(props) => getTypographyByKey(props, "btnLarge")};
  color: ${Colors.DOVE_GRAY2};
  margin: 10px 0px;
`;

const EditDatasourceButton = styled(Button)`
  margin-top: 30px;
`;

const Bold = styled.span`
  font-weight: 500;
`;

const DescWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  font-weight: 500;
  color: ${Colors.CODE_GRAY};
  font-size: 24px;
`;
// ---------- Types ----------

// ---------- GeneratePageForm Component ----------

const GENERATE_PAGE_MODE = {
  NEW: "NEW", // a new page is created for the template. (new pageId created)
  REPLACE_EMPTY: "REPLACE_EMPTY", // current page's content (DSL) is updated to template DSL. (same pageId)
};

function GeneratePageForm() {
  const dispatch = useDispatch();
  const querySearch = useLocation().search;

  const {
    applicationId: currentApplicationId,
    pageId: currentPageId,
  } = useParams<ExplorerURLParams>();

  const datasources: Datasource[] = useSelector(getDatasources);
  const isGeneratingTemplatePage = useSelector(getIsGeneratingTemplatePage);
  const currentMode = useRef(GENERATE_PAGE_MODE.REPLACE_EMPTY);

  const [datasourceIdToBeSelected, setDatasourceIdToBeSelected] = useState<
    string
  >("");
  const datasourcesStructure = useSelector(getDatasourcesStructure);

  const isFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );

  const [datasourceTableOptions, setSelectedDatasourceTableOptions] = useState<
    DropdownOptions
  >([]);

  const [selectedTableColumnOptions, setSelectedTableColumnOptions] = useState<
    DropdownOptions
  >([]);

  const [selectedDatasource, selectDataSource] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const [selectedTable, selectTable] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const [
    selectedDatasourceIsInvalid,
    setSelectedDatasourceIsInvalid,
  ] = useState(false);

  const [selectedColumn, selectColumn] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const onSelectDataSource = useCallback(
    (
      datasource: string | undefined,
      dataSourceObj: DropdownOption | undefined,
    ) => {
      if (datasource && dataSourceObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_DATASOURCE");
        selectDataSource(dataSourceObj);
        setSelectedDatasourceTableOptions([]);
        setSelectedTableColumnOptions([]);
        selectTable(DEFAULT_DROPDOWN_OPTION);
        selectColumn(DEFAULT_DROPDOWN_OPTION);
        const datasourcePluginId = dataSourceObj.data?.pluginId;
        const pluginPackageName: string =
          generateCRUDSupportedPlugin[datasourcePluginId];
        switch (pluginPackageName) {
          case PLUGIN_PACKAGE_NAME.S3:
            break;
          case PLUGIN_PACKAGE_NAME.GOOGLE_SHEETS:
            break;
          default: {
            if (dataSourceObj.id) {
              dispatch(fetchDatasourceStructure(dataSourceObj.id, true));
            }
          }
        }
      }
    },
    [
      selectDataSource,
      setSelectedDatasourceTableOptions,
      setSelectedTableColumnOptions,
      selectTable,
      selectColumn,
      dispatch,
      generateCRUDSupportedPlugin,
    ],
  );

  const onSelectTable = useCallback(
    (table: string | undefined, TableObj: DatasourceTableDropdownOption) => {
      if (table && TableObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_TABLE");
        selectTable(TableObj);
        selectColumn(DEFAULT_DROPDOWN_OPTION);
        const { data } = TableObj;
        const columnIcon: IconName = "column";
        if (data.columns && Array.isArray(data.columns)) {
          const newSelectedTableColumnOptions: DropdownOption[] = [];
          data.columns.map((column) => {
            if (
              column.type &&
              ALLOWED_SEARCH_DATATYPE.includes(column.type.toLowerCase())
            ) {
              newSelectedTableColumnOptions.push({
                id: column.name,
                label: column.name,
                value: column.name,
                subText: column.type,
                icon: columnIcon,
                iconSize: IconSize.LARGE,
                iconColor: Colors.GOLD,
              });
            }
          });
          if (newSelectedTableColumnOptions) {
            setSelectedTableColumnOptions(newSelectedTableColumnOptions);
          }
        } else {
          setSelectedTableColumnOptions([]);
        }
      }
    },
    [selectTable, setSelectedTableColumnOptions, selectColumn],
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

  const dataSourceOptions = useDatasourceOptions({
    datasources,
    generateCRUDSupportedPlugin,
  });

  useEffect(() => {
    if (
      selectedDatasource.id &&
      selectedDatasource.value &&
      !isFetchingDatasourceStructure
    ) {
      // On finished fetching datasource structure
      const selectedDatasourceStructure =
        datasourcesStructure[selectedDatasource.id] || {};

      const datasourceIcon: IconName = "tables";
      const hasError = selectedDatasourceStructure?.error;

      if (hasError) {
        setSelectedDatasourceIsInvalid(true);
      } else {
        setSelectedDatasourceIsInvalid(false);
        const tables = selectedDatasourceStructure?.tables;
        if (tables) {
          const newTables = tables.map(({ columns, name }) => ({
            id: name,
            label: name,
            value: name,
            icon: datasourceIcon,
            iconSize: IconSize.LARGE,
            iconColor: Colors.BURNING_ORANGE,
            data: {
              columns,
            },
          }));
          setSelectedDatasourceTableOptions(newTables);
        }
      }
    }
  }, [
    datasourcesStructure,
    selectedDatasource,
    isFetchingDatasourceStructure,
    setSelectedDatasourceIsInvalid,
    setSelectedDatasourceTableOptions,
  ]);

  useEffect(() => {
    // If there is any datasource id passed in queryParams which needs to be selected
    if (datasourceIdToBeSelected) {
      if (selectedDatasource.id !== datasourceIdToBeSelected) {
        for (let i = 0; i < dataSourceOptions.length; i++) {
          if (dataSourceOptions[i].id === datasourceIdToBeSelected) {
            onSelectDataSource(
              dataSourceOptions[i].value,
              dataSourceOptions[i],
            );
            setDatasourceIdToBeSelected("");
            break;
          }
        }
      }
    }
  }, [dataSourceOptions, datasourceIdToBeSelected, onSelectDataSource]);

  useEffect(() => {
    if (querySearch) {
      const queryParams = getQueryParams();
      const datasourceId = queryParams.datasourceId;
      const generateNewPage = queryParams.new_page;
      if (datasourceId) {
        if (generateNewPage) {
          currentMode.current = GENERATE_PAGE_MODE.NEW;
        } else {
          currentMode.current = GENERATE_PAGE_MODE.REPLACE_EMPTY;
        }
        setDatasourceIdToBeSelected(datasourceId);
        delete queryParams.datasourceId;
        delete queryParams.new_page;
        const redirectURL =
          window.location.pathname + convertToQueryParams(queryParams);
        history.replace(redirectURL);
      }
    }
  }, [querySearch]);

  const routeToCreateNewDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_CREATE_NEW_DATASOURCE");
    history.push(
      `${INTEGRATION_EDITOR_URL(
        currentApplicationId,
        currentPageId,
        INTEGRATION_TABS.NEW,
      )}?isGeneratePageMode=generate-page`,
    );
  };

  const handleFormSubmit = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_FORM_SUBMIT");
    dispatch(
      generateTemplateToUpdatePage({
        applicationId: currentApplicationId || "",
        pageId:
          currentMode.current === GENERATE_PAGE_MODE.NEW
            ? ""
            : currentPageId || "",
        columns: [],
        searchColumn: selectedColumn.value,
        tableName: selectedTable.value || "",
        datasourceId: selectedDatasource.id || "",
        mode: currentMode.current,
      }),
    );
  };

  const goToEditDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_EDIT_DATASOURCE_CONFIG", {
      datasourceId: selectedDatasource.id,
    });
    const redirectURL = DATA_SOURCES_EDITOR_ID_URL(
      currentApplicationId,
      currentPageId,
      selectedDatasource.id,
      { isGeneratePageMode: "generate-page" },
    );
    history.push(redirectURL);
  };

  const showSubmitButton = selectedTable.value;
  const submitButtonDisable = !selectedTable.value;
  // if the datasource has basic information to connect to db it is considered as a valid structure hence isValid true.
  const isValidDatasourceConfig = selectedDatasource.data?.isValid;
  const selectedDatasourcePluginId: string = selectedDatasource.data?.pluginId;
  const selectedDatasourcePluginPackageName: string =
    generateCRUDSupportedPlugin[selectedDatasourcePluginId];
  const pluginField: {
    TABLE: string;
    COLUMN: string;
  } =
    selectedDatasourcePluginPackageName &&
    PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      ? PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      : PluginFormInputFieldMap.DEFAULT;
  const tableLabel = pluginField.TABLE;
  const columnLabel = pluginField.COLUMN;

  let tableDropdownErrorMsg = "";
  if (!isFetchingDatasourceStructure) {
    if (datasourceTableOptions.length === 0) {
      tableDropdownErrorMsg = `Couldn't find any ${tableLabel}, Please select another datasource`;
    }
    if (selectedDatasourceIsInvalid || !isValidDatasourceConfig) {
      tableDropdownErrorMsg = `Failed fetching datasource structure, Please check your datasource configuration`;
    }
  }

  const isGoogleSheetPlugin =
    selectedDatasourcePluginPackageName === PLUGIN_PACKAGE_NAME.GOOGLE_SHEETS;

  const showSearchableColumnDropdown =
    PLUGIN_PACKAGE_NAME.S3 !== selectedDatasourcePluginPackageName;

  return (
    <div>
      <Wrapper>
        <DescWrapper>
          <Title>{GENERATE_PAGE_FORM_TITLE()}</Title>
        </DescWrapper>
      </Wrapper>
      <FormWrapper>
        <SelectWrapper>
          <Label>Select Datasource</Label>
          <Dropdown
            cypressSelector="t--datasource-dropdown"
            defaultIsOpen={!selectedDatasource.value}
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            onSelect={onSelectDataSource}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={dataSourceOptions}
            renderOption={({ isSelectedNode, option, optionClickHandler }) => (
              <DataSourceOption
                cypressSelector="t--datasource-dropdown-option"
                extraProps={{ routeToCreateNewDatasource }}
                isSelectedNode={isSelectedNode}
                key={option.id}
                option={option}
                optionClickHandler={optionClickHandler}
              />
            )}
            selected={selectedDatasource}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
        {!isGoogleSheetPlugin ? (
          <>
            {selectedDatasource.value ? (
              <SelectWrapper>
                <Label>
                  Select {tableLabel} from{" "}
                  <Bold>{selectedDatasource.label}</Bold>
                </Label>
                <Dropdown
                  cypressSelector="t--table-dropdown"
                  defaultIsOpen={
                    !!selectedDatasource.value && !selectedTable.value
                  }
                  dropdownMaxHeight={"300px"}
                  errorMsg={tableDropdownErrorMsg}
                  height={DROPDOWN_DIMENSION.HEIGHT}
                  isLoading={isFetchingDatasourceStructure}
                  onSelect={onSelectTable}
                  optionWidth={DROPDOWN_DIMENSION.WIDTH}
                  options={datasourceTableOptions}
                  selected={selectedTable}
                  showLabelOnly
                  width={DROPDOWN_DIMENSION.WIDTH}
                />
              </SelectWrapper>
            ) : null}
            {!isFetchingDatasourceStructure &&
              (selectedDatasourceIsInvalid || !isValidDatasourceConfig) &&
              selectedDatasource.value && (
                <EditDatasourceButton
                  category={Category.tertiary}
                  onClick={goToEditDatasource}
                  size={Size.medium}
                  text="Edit Datasource"
                  type="button"
                />
              )}
            {selectedTable.value && showSearchableColumnDropdown && (
              <SelectWrapper>
                <Label>
                  Select a searchable {columnLabel} from
                  <Bold> {selectedTable.label} </Bold>
                </Label>
                <Dropdown
                  cypressSelector="t--searchColumn-dropdown"
                  dropdownMaxHeight={"300px"}
                  height={DROPDOWN_DIMENSION.HEIGHT}
                  onSelect={onSelectColumn}
                  optionWidth={DROPDOWN_DIMENSION.WIDTH}
                  options={selectedTableColumnOptions}
                  selected={selectedColumn}
                  showLabelOnly
                  width={DROPDOWN_DIMENSION.WIDTH}
                />
              </SelectWrapper>
            )}
          </>
        ) : (
          <GoogleSheetForm
            columnLabel={columnLabel}
            datasourceTableOptions={datasourceTableOptions}
            googleSheetPluginId={selectedDatasourcePluginId}
            isFetchingDatasourceStructure={isFetchingDatasourceStructure}
            onSelectColumn={onSelectColumn}
            onSelectTable={onSelectTable}
            selectedColumn={selectedColumn}
            selectedDatasource={selectedDatasource}
            selectedTable={selectedTable}
            selectedTableColumnOptions={selectedTableColumnOptions}
            setSelectedDatasourceTableOptions={
              setSelectedDatasourceTableOptions
            }
            tableDropdownErrorMsg={tableDropdownErrorMsg}
            tableLabel={tableLabel}
          />
        )}

        {showSubmitButton ? (
          <FormSubmitButton
            category={Category.tertiary}
            data-cy="t--generate-page-form-submit"
            disabled={submitButtonDisable}
            isLoading={isGeneratingTemplatePage}
            onClick={handleFormSubmit}
            size={Size.large}
            text="Generate Page"
            type="button"
          />
        ) : null}
      </FormWrapper>
    </div>
  );
}

export default GeneratePageForm;
