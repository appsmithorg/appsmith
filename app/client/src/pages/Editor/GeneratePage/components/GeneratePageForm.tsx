import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { getTypographyByKey } from "../../../../constants/DefaultTheme";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector, useDispatch } from "react-redux";
import {
  getDatasources,
  getIsFetchingDatasourceStructure,
} from "../../../../selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";
import { fetchDatasourceStructure } from "../../../../actions/datasourceActions";
import { getDatasourcesStructure } from "selectors/entitiesSelector";
import { fetchPage, generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams, useLocation } from "react-router";
import { ExplorerURLParams } from "../../Explorer/helpers";
import {
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
  DATA_SOURCES_EDITOR_ID_URL,
} from "constants/routes";
import history from "utils/history";
import { getQueryParams } from "utils/AppsmithUtils";
import { getIsGeneratingTemplatePage } from "selectors/pageListSelectors";
import DataSourceOption, {
  CONNECT_NEW_DATASOURCE_OPTION_ID,
} from "./DataSourceOption";
import { convertToQueryParams } from "constants/routes";
import { IconName, IconSize } from "components/ads/Icon";
import GoogleSheetForm from "./GoogleSheetForm";
import {
  VALID_PLUGINS_FOR_TEMPLATE,
  PLUGIN_ID,
  DropdownOptions,
  DatasourceTableDropdownOption,
} from "./constants";

export const PluginFormInputFieldMap: Record<
  string,
  { DATASOURCE: string; TABLE: string; COLUMN: string }
> = {
  "5e687c18fb01e64e6a3f873f": {
    DATASOURCE: "MongoDB",
    TABLE: "collection",
    COLUMN: "field",
  },
  "6023b4a070eb652de19476d3": {
    DATASOURCE: "S3",
    TABLE: "bucket",
    COLUMN: "keys",
  },
  [PLUGIN_ID.GOOGLE_SHEET]: {
    DATASOURCE: "Google Sheets",
    TABLE: "spreadsheet",
    COLUMN: "keys",
  },
  DEFAULT: {
    DATASOURCE: "SQL Based",
    TABLE: "table",
    COLUMN: "column",
  },
};

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

const FAKE_DATASOURCE_OPTION = {
  CONNECT_NEW_DATASOURCE_OPTION: {
    id: CONNECT_NEW_DATASOURCE_OPTION_ID,
    label: "Connect New Datasource",
    value: "Connect New Datasource",
    data: {
      pluginId: "",
    },
  },
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

  const datasourcesStructure = useSelector(getDatasourcesStructure);

  const isFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const [dataSourceOptions, setDataSourceOptions] = useState<DropdownOptions>(
    [],
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
        selectDataSource(dataSourceObj);
        setSelectedDatasourceTableOptions([]);
        setSelectedTableColumnOptions([]);
        selectTable(DEFAULT_DROPDOWN_OPTION);
        selectColumn(DEFAULT_DROPDOWN_OPTION);
        if (dataSourceObj.id) {
          dispatch(fetchDatasourceStructure(dataSourceObj.id, true));
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
    ],
  );

  const onSelectTable = useCallback(
    (table: string | undefined, TableObj: DatasourceTableDropdownOption) => {
      if (table && TableObj) {
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
        selectColumn(ColumnObj);
      }
    },
    [selectColumn],
  );

  useEffect(() => {
    // On mount of component and on change of datasources, Update the list.
    const unSupportedDatasourceOptions: DropdownOptions = [];
    const supportedDatasourceOptions: DropdownOptions = [];
    let newDataSourceOptions: DropdownOptions = [];
    newDataSourceOptions.push(
      FAKE_DATASOURCE_OPTION.CONNECT_NEW_DATASOURCE_OPTION,
    );
    datasources.forEach(({ id, isValid, name, pluginId }) => {
      const datasourceObject = {
        id,
        label: name,
        value: name,
        data: {
          pluginId,
          isSupportedForTemplate: VALID_PLUGINS_FOR_TEMPLATE[pluginId],
          isValid,
        },
      };
      if (VALID_PLUGINS_FOR_TEMPLATE[pluginId])
        supportedDatasourceOptions.push(datasourceObject);
      else {
        unSupportedDatasourceOptions.push(datasourceObject);
      }
    });
    newDataSourceOptions = newDataSourceOptions.concat(
      supportedDatasourceOptions,
      unSupportedDatasourceOptions,
    );
    setDataSourceOptions(newDataSourceOptions);
  }, [datasources, setDataSourceOptions]);

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

  const onSelectNewDatasource = (newDatasourceId: string) => {
    if (newDatasourceId) {
      if (selectedDatasource.id !== newDatasourceId) {
        for (let i = 0; i < dataSourceOptions.length; i++) {
          if (dataSourceOptions[i].id === newDatasourceId) {
            onSelectDataSource(
              dataSourceOptions[i].value,
              dataSourceOptions[i],
            );
            break;
          }
        }
      }
    }
  };

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
        onSelectNewDatasource(datasourceId);
        delete queryParams.datasourceId;
        delete queryParams.new_page;
        const redirectURL =
          window.location.pathname + convertToQueryParams(queryParams);
        history.replace(redirectURL);
      }
    }
  }, [querySearch]);

  useEffect(() => {
    // On mount if currentPageId is defined then fetch page details and render canvas for it.
    // Irrespective of it being an empty page.
    if (currentPageId) {
      dispatch(fetchPage(currentPageId));
    }
  }, [currentPageId]);

  const routeToCreateNewDatasource = () => {
    history.push(
      `${INTEGRATION_EDITOR_URL(
        currentApplicationId,
        currentPageId,
        INTEGRATION_TABS.NEW,
      )}?initiator=generate-page`,
    );
  };

  const handleFormSubmit = () => {
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
    const redirectURL = DATA_SOURCES_EDITOR_ID_URL(
      currentApplicationId,
      currentPageId,
      selectedDatasource.id,
      { initiator: "generate-page" },
    );
    history.push(redirectURL);
  };

  const showSubmitButton = selectedTable.value;
  const submitButtonDisable = !selectedTable.value;
  // if the datasource has basic information to connect to db it is considered as a valid structure hence isValid true.
  const isValidDatasourceConfig = selectedDatasource.data?.isValid;
  const selectedDatasourcePluginId: string = selectedDatasource.data?.pluginId;
  const pluginField: {
    TABLE: string;
    COLUMN: string;
  } =
    selectedDatasourcePluginId &&
    PluginFormInputFieldMap[selectedDatasourcePluginId]
      ? PluginFormInputFieldMap[selectedDatasourcePluginId]
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
    selectedDatasourcePluginId === PLUGIN_ID.GOOGLE_SHEET;

  return (
    <div>
      <Wrapper>
        <DescWrapper>
          <Title>Generate from Data</Title>
        </DescWrapper>
      </Wrapper>
      <FormWrapper>
        <SelectWrapper>
          <Label>Select Datasource</Label>
          <Dropdown
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            onSelect={onSelectDataSource}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={dataSourceOptions}
            renderOption={({ isSelectedNode, option, optionClickHandler }) => (
              <DataSourceOption
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
            {selectedTable.value ? (
              <SelectWrapper>
                <Label>
                  Select a searchable {columnLabel} from
                  <Bold> {selectedTable.label} </Bold>
                </Label>
                <Dropdown
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
            ) : null}
          </>
        ) : (
          <GoogleSheetForm
            columnLabel={columnLabel}
            datasourceTableOptions={datasourceTableOptions}
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
            data-cy="generate-page-form-submit"
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
