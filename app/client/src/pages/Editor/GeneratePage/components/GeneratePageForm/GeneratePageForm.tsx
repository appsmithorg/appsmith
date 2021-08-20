import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { getTypographyByKey } from "constants/DefaultTheme";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector, useDispatch } from "react-redux";
import {
  getDatasources,
  getIsFetchingDatasourceStructure,
  getGenerateCRUDEnabledPluginMap,
  getIsFetchingSinglePluginForm,
  getDatasourcesStructure,
  getIsExecutingDatasourceQuery,
} from "selectors/entitiesSelector";

import { Datasource } from "entities/Datasource";
import { fetchDatasourceStructure } from "actions/datasourceActions";
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
import { GENERATE_PAGE_FORM_TITLE } from "constants/messages";
import { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { useDatasourceOptions, useS3BucketList } from "./hooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { AppState } from "reducers/index";
import {
  DropdownOptions,
  DatasourceTableDropdownOption,
  PluginFormInputFieldMap,
  PLUGIN_PACKAGE_NAME,
  DEFAULT_DROPDOWN_OPTION,
  DROPDOWN_DIMENSION,
  ALLOWED_SEARCH_DATATYPE,
} from "../constants";

import { Bold, Label, SelectWrapper } from "./styles";

//  ---------- Styles ----------

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 20px 0px;
  border: none;
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

// Constants

const datasourceIcon: IconName = "tables";

const GENERATE_PAGE_MODE = {
  NEW: "NEW", // a new page is created for the template. (new pageId created)
  REPLACE_EMPTY: "REPLACE_EMPTY", // current page's content (DSL) is updated to template DSL. (same pageId)
};

// ---------- GeneratePageForm Component ----------

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

  const selectedDatasourcePluginId: string = selectedDatasource.data?.pluginId;
  const selectedDatasourcePluginPackageName: string =
    generateCRUDSupportedPlugin[selectedDatasourcePluginId];

  const isGoogleSheetPlugin =
    selectedDatasourcePluginPackageName === PLUGIN_PACKAGE_NAME.GOOGLE_SHEETS;

  const isS3Plugin =
    selectedDatasourcePluginPackageName === PLUGIN_PACKAGE_NAME.S3;

  const isFetchingSheetPluginForm = useSelector((state: AppState) => {
    if (isGoogleSheetPlugin) {
      return getIsFetchingSinglePluginForm(
        state,
        selectedDatasource.data?.pluginId,
      );
    }
    return false;
  });

  const isExecutingDatasourceQuery = useSelector(getIsExecutingDatasourceQuery);

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

  const {
    bucketList,
    failedFetchingBucketList,
    fetchBucketList,
    isFetchingBucketList,
  } = useS3BucketList();

  const onSelectDataSource = useCallback(
    (
      datasource: string | undefined,
      dataSourceObj: DropdownOption | undefined,
    ) => {
      if (
        datasource &&
        dataSourceObj &&
        selectedDatasource.id !== dataSourceObj.id
      ) {
        const pluginId: string = dataSourceObj.data.pluginId;
        const pluginPackageName: string = generateCRUDSupportedPlugin[pluginId];
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_DATASOURCE", {
          datasourceType: pluginPackageName,
        });
        selectDataSource(dataSourceObj);
        setSelectedDatasourceTableOptions([]);
        setSelectedTableColumnOptions([]);
        selectTable(DEFAULT_DROPDOWN_OPTION);
        selectColumn(DEFAULT_DROPDOWN_OPTION);

        switch (pluginPackageName) {
          case PLUGIN_PACKAGE_NAME.S3:
            fetchBucketList({ selectedDatasource: dataSourceObj });
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
      generateCRUDSupportedPlugin,
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
        if (!isGoogleSheetPlugin && !isS3Plugin) {
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
      }
    },
    [
      selectTable,
      setSelectedTableColumnOptions,
      selectColumn,
      isGoogleSheetPlugin,
      isS3Plugin,
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

  const dataSourceOptions = useDatasourceOptions({
    datasources,
    generateCRUDSupportedPlugin,
  });

  useEffect(() => {
    if (isS3Plugin && bucketList && bucketList.length) {
      const tables = bucketList.map((bucketName) => ({
        id: bucketName,
        label: bucketName,
        value: bucketName,
        icon: datasourceIcon,
        iconSize: IconSize.LARGE,
        iconColor: Colors.BURNING_ORANGE,
      }));
      setSelectedDatasourceTableOptions(tables);
    }
  }, [bucketList, isS3Plugin]);

  useEffect(() => {
    if (
      selectedDatasource.id &&
      selectedDatasource.value &&
      !isFetchingDatasourceStructure
    ) {
      // On finished fetching datasource structure
      const selectedDatasourceStructure =
        datasourcesStructure[selectedDatasource.id] || {};

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

  const submitButtonDisable = !selectedTable.value;
  // if the datasource has basic information to connect to db it is considered as a valid structure hence isValid true.
  const isValidDatasourceConfig = selectedDatasource.data?.isValid;

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

  const fetchingDatasourceConfigs =
    isFetchingDatasourceStructure ||
    (isFetchingBucketList && isS3Plugin) ||
    ((isFetchingSheetPluginForm || isExecutingDatasourceQuery) &&
      isGoogleSheetPlugin);

  const fetchingDatasourceConfigError =
    selectedDatasourceIsInvalid ||
    !isValidDatasourceConfig ||
    (failedFetchingBucketList && isS3Plugin);

  if (!fetchingDatasourceConfigs) {
    if (datasourceTableOptions.length === 0) {
      tableDropdownErrorMsg = `Couldn't find any ${tableLabel}, Please select another datasource`;
    }
    if (fetchingDatasourceConfigError) {
      tableDropdownErrorMsg = `Failed fetching datasource structure, Please check your datasource configuration`;
    }
  }

  const showEditDatasourceBtn =
    !fetchingDatasourceConfigs &&
    fetchingDatasourceConfigError &&
    !!selectedDatasource.value;

  const showSubmitButton = selectedTable.value && !showEditDatasourceBtn;

  const showSearchableColumnDropdown =
    !!selectedTable.value &&
    PLUGIN_PACKAGE_NAME.S3 !== selectedDatasourcePluginPackageName;

  return (
    <div>
      <Wrapper>
        <DescWrapper>
          <Title>{GENERATE_PAGE_FORM_TITLE()}</Title>
        </DescWrapper>
      </Wrapper>
      <FormWrapper>
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>Select Datasource</Label>
          <Dropdown
            cypressSelector="t--datasource-dropdown"
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
        {selectedDatasource.value ? (
          <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
            <Label>
              Select {tableLabel} from <Bold>{selectedDatasource.label}</Bold>
            </Label>
            <Dropdown
              cypressSelector="t--table-dropdown"
              dropdownMaxHeight={"300px"}
              errorMsg={tableDropdownErrorMsg}
              height={DROPDOWN_DIMENSION.HEIGHT}
              isLoading={fetchingDatasourceConfigs}
              onSelect={onSelectTable}
              optionWidth={DROPDOWN_DIMENSION.WIDTH}
              options={datasourceTableOptions}
              selected={selectedTable}
              showLabelOnly
              width={DROPDOWN_DIMENSION.WIDTH}
            />
          </SelectWrapper>
        ) : null}
        {showEditDatasourceBtn && (
          <EditDatasourceButton
            category={Category.tertiary}
            onClick={goToEditDatasource}
            size={Size.medium}
            text="Edit Datasource"
            type="button"
          />
        )}
        {!isGoogleSheetPlugin ? (
          showSearchableColumnDropdown && (
            <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
              <Label>
                Select a searchable {columnLabel} from
                <Bold> {selectedTable.label} </Bold>
              </Label>
              <Dropdown
                cypressSelector="t--searchColumn-dropdown"
                dropdownMaxHeight={"300px"}
                height={DROPDOWN_DIMENSION.HEIGHT}
                helperText="* Optional"
                onSelect={onSelectColumn}
                optionWidth={DROPDOWN_DIMENSION.WIDTH}
                options={selectedTableColumnOptions}
                selected={selectedColumn}
                showLabelOnly
                width={DROPDOWN_DIMENSION.WIDTH}
              />
            </SelectWrapper>
          )
        ) : (
          <GoogleSheetForm
            googleSheetPluginId={selectedDatasourcePluginId}
            selectedDatasource={selectedDatasource}
            selectedSpreadsheet={selectedTable}
            setSelectedDatasourceIsInvalid={setSelectedDatasourceIsInvalid}
            setSelectedDatasourceTableOptions={
              setSelectedDatasourceTableOptions
            }
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
