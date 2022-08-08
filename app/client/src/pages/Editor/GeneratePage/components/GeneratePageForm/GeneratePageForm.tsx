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
} from "selectors/entitiesSelector";

import { Datasource } from "entities/Datasource";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams, useLocation } from "react-router";
import { ExplorerURLParams } from "../../../Explorer/helpers";
import { INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import { getQueryParams } from "utils/URLUtils";
import { getIsGeneratingTemplatePage } from "selectors/pageListSelectors";
import DataSourceOption from "../DataSourceOption";
import { getQueryStringfromObject } from "RouteBuilder";
import { IconName, IconSize } from "components/ads/Icon";
import GoogleSheetForm from "./GoogleSheetForm";
import {
  GENERATE_PAGE_FORM_TITLE,
  createMessage,
  GEN_CRUD_DATASOURCE_DROPDOWN_LABEL,
} from "@appsmith/constants/messages";
import { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import {
  useDatasourceOptions,
  useSheetsList,
  useSpreadSheets,
  useSheetColumnHeaders,
  useS3BucketList,
} from "./hooks";
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
import { TooltipComponent as Tooltip } from "design-system";
import { Bold, Label, SelectWrapper } from "./styles";
import { GeneratePagePayload } from "./types";
import Icon from "components/ads/Icon";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import { datasourcesEditorIdURL, integrationEditorURL } from "RouteBuilder";

//  ---------- Styles ----------

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

const Row = styled.p`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  white-space: nowrap;
`;

// Constants

const datasourceIcon: IconName = "tables";
const columnIcon: IconName = "column";

const GENERATE_PAGE_MODE = {
  NEW: "NEW", // a new page is created for the template. (new pageId created)
  REPLACE_EMPTY: "REPLACE_EMPTY", // current page's content (DSL) is updated to template DSL. (same pageId)
};

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

// ---------- GeneratePageForm Component ----------

function GeneratePageForm() {
  const dispatch = useDispatch();
  const querySearch = useLocation().search;

  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const applicationId = useSelector(getCurrentApplicationId);

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

  const [isSelectedTableEmpty, setIsSelectedTableEmpty] = useState<boolean>(
    false,
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
    isFetchingBucketList,
  } = useS3BucketList();

  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );

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
        setSelectedDatasourceIsInvalid(false);
        if (dataSourceObj.id) {
          switch (pluginPackageName) {
            case PLUGIN_PACKAGE_NAME.GOOGLE_SHEETS:
              break;
            default: {
              if (dataSourceObj.id) {
                dispatch(fetchDatasourceStructure(dataSourceObj.id, true));
              }
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
      setSelectedDatasourceIsInvalid,
      selectedDatasource,
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

          if (Array.isArray(data.columns)) {
            if (data.columns.length === 0) setIsSelectedTableEmpty(true);
            else {
              if (isSelectedTableEmpty) setIsSelectedTableEmpty(false);
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
              setSelectedTableColumnOptions(newSelectedTableColumnOptions);
            }
          } else {
            setSelectedTableColumnOptions([]);
          }
        }
      }
    },
    [
      isSelectedTableEmpty,
      selectTable,
      setSelectedTableColumnOptions,
      selectColumn,
      setIsSelectedTableEmpty,
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

  const spreadSheetsProps = useSpreadSheets({
    setSelectedDatasourceTableOptions,
    setSelectedDatasourceIsInvalid,
  });

  const sheetsListProps = useSheetsList();

  const sheetColumnsHeaderProps = useSheetColumnHeaders();

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
  }, [bucketList, isS3Plugin, setSelectedDatasourceTableOptions]);

  useEffect(() => {
    if (
      selectedDatasource.id &&
      selectedDatasource.value &&
      !isFetchingDatasourceStructure
    ) {
      // when finished fetching datasource structure
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
  }, [
    dataSourceOptions,
    datasourceIdToBeSelected,
    onSelectDataSource,
    setDatasourceIdToBeSelected,
  ]);

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
          window.location.pathname + getQueryStringfromObject(queryParams);
        history.replace(redirectURL);
      }
    }
  }, [querySearch, setDatasourceIdToBeSelected]);

  const routeToCreateNewDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_CREATE_NEW_DATASOURCE");
    history.push(
      integrationEditorURL({
        pageId: currentPageId,
        selectedTab: INTEGRATION_TABS.NEW,
        params: { isGeneratePageMode: "generate-page" },
      }),
    );
  };

  const generatePageAction = (data: GeneratePagePayload) => {
    let extraParams = {};
    if (data.pluginSpecificParams) {
      extraParams = {
        pluginSpecificParams: data.pluginSpecificParams,
      };
    }

    const payload = {
      applicationId: applicationId || "",
      pageId:
        currentMode.current === GENERATE_PAGE_MODE.NEW
          ? ""
          : currentPageId || "",
      columns: data.columns || [],
      searchColumn: data.searchColumn,
      tableName: data.tableName,
      datasourceId: selectedDatasource.id || "",
      mode: currentMode.current,
      ...extraParams,
    };

    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_FORM_SUBMIT");
    dispatch(generateTemplateToUpdatePage(payload));
    if (isFirstTimeUserOnboardingEnabled) {
      dispatch({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
        payload: "",
      });
    }
    if (isFirstTimeUserOnboardingComplete) {
      dispatch({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE,
        payload: false,
      });
    }
  };

  const handleFormSubmit = () => {
    const payload = {
      columns: [],
      searchColumn: selectedColumn.value,
      tableName: selectedTable.value || "",
    };
    generatePageAction(payload);
  };

  const goToEditDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_EDIT_DATASOURCE_CONFIG", {
      datasourceId: selectedDatasource.id,
    });
    const redirectURL = datasourcesEditorIdURL({
      pageId: currentPageId,
      datasourceId: selectedDatasource.id as string,
      params: { isGeneratePageMode: "generate-page" },
    });
    history.push(redirectURL);
  };

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

  let tableDropdownErrorMsg = "";

  const fetchingDatasourceConfigs =
    isFetchingDatasourceStructure ||
    (isFetchingBucketList && isS3Plugin) ||
    ((isFetchingSheetPluginForm || spreadSheetsProps.isFetchingSpreadsheets) &&
      isGoogleSheetPlugin);

  const fetchingDatasourceConfigError =
    selectedDatasourceIsInvalid ||
    !isValidDatasourceConfig ||
    (failedFetchingBucketList && isS3Plugin);

  if (!fetchingDatasourceConfigs) {
    if (datasourceTableOptions.length === 0) {
      tableDropdownErrorMsg = `Couldn't find any ${pluginField.TABLE}, Please select another datasource`;
    }
    if (fetchingDatasourceConfigError) {
      tableDropdownErrorMsg = `Failed fetching datasource structure, Please check your datasource configuration`;
    }
    if (isSelectedTableEmpty) {
      tableDropdownErrorMsg = `Couldn't find any columns, Please select table with columns.`;
    }
  }

  const showEditDatasourceBtn =
    !isFetchingDatasourceStructure &&
    (selectedDatasourceIsInvalid || !isValidDatasourceConfig) &&
    !!selectedDatasource.value;

  const showSearchableColumn =
    !!selectedTable.value &&
    PLUGIN_PACKAGE_NAME.S3 !== selectedDatasourcePluginPackageName;

  const showSubmitButton =
    selectedTable.value &&
    !showEditDatasourceBtn &&
    !fetchingDatasourceConfigs &&
    !fetchingDatasourceConfigError &&
    !!selectedDatasource.value;

  const submitButtonDisable =
    !selectedTable.value || !showSubmitButton || isSelectedTableEmpty;

  return (
    <div className="space-y-4">
      <Wrapper>
        <DescWrapper>
          <Title>{GENERATE_PAGE_FORM_TITLE()}</Title>
        </DescWrapper>
      </Wrapper>
      <FormWrapper>
        <SelectWrapper className="space-y-2" width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>{createMessage(GEN_CRUD_DATASOURCE_DROPDOWN_LABEL)}</Label>
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
                key={(option as DropdownOption).id}
                option={option}
                optionClickHandler={optionClickHandler}
                optionWidth={DROPDOWN_DIMENSION.WIDTH}
              />
            )}
            selected={selectedDatasource}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
        {selectedDatasource.value ? (
          <SelectWrapper className="space-y-2" width={DROPDOWN_DIMENSION.WIDTH}>
            <Label>
              Select {pluginField.TABLE} from{" "}
              <Bold>{selectedDatasource.label}</Bold>
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
          <>
            {showSearchableColumn && (
              <SelectWrapper
                className="space-y-2"
                width={DROPDOWN_DIMENSION.WIDTH}
              >
                <Row>
                  Select a searchable {pluginField.COLUMN} from the
                  selected&nbsp;
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
            <div className="mt-4">
              <GeneratePageSubmitBtn
                disabled={submitButtonDisable}
                isLoading={!!isGeneratingTemplatePage}
                onSubmit={handleFormSubmit}
                showSubmitButton={!!showSubmitButton}
              />
            </div>
          </>
        ) : (
          <GoogleSheetForm
            generatePageAction={generatePageAction}
            googleSheetPluginId={selectedDatasourcePluginId}
            renderSubmitButton={({
              disabled,
              isLoading,
              onSubmit,
            }: {
              onSubmit: () => void;
              disabled: boolean;
              isLoading: boolean;
            }) => (
              <GeneratePageSubmitBtn
                disabled={disabled}
                isLoading={!!isGeneratingTemplatePage || isLoading}
                onSubmit={onSubmit}
                showSubmitButton={!!showSubmitButton}
              />
            )}
            selectedDatasource={selectedDatasource}
            selectedSpreadsheet={selectedTable}
            sheetColumnsHeaderProps={sheetColumnsHeaderProps}
            sheetsListProps={sheetsListProps}
            spreadSheetsProps={spreadSheetsProps}
          />
        )}
      </FormWrapper>
    </div>
  );
}

export default GeneratePageForm;
