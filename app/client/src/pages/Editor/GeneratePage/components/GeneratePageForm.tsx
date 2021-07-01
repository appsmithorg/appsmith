import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { getTypographyByKey } from "../../../../constants/DefaultTheme";
import {
  IconWrapper,
  RoundBg,
  DescWrapper,
  Title,
  SubTitle,
} from "./commonStyle";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector, useDispatch } from "react-redux";
import {
  getDatasources,
  getPlugins,
} from "../../../../selectors/entitiesSelector";
import {
  Datasource,
  DatasourceStructure,
  DatasourceTable,
} from "entities/Datasource";
import { fetchDatasourceStructure } from "../../../../actions/datasourceActions";
import { getDatasourcesStructure } from "../../../../selectors/entitiesSelector";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../../Explorer/helpers";
import {
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
} from "../../../../constants/routes";
import history from "utils/history";
import DataSourceOption, {
  CONNECT_NEW_DATASOURCE_OPTION_ID,
  MOCK_DATABASES_OPTION_ID,
} from "./DataSourceOption";

// Temporary hardcoded valid plugins which support generate template
// pluginId - pluginName
export const VALID_PLUGINS_FOR_TEMPLATE: Record<string, string> = {
  "5c9f512f96c1a50004819786": "PostgreSQL",
  "5f16c4be93f44d4622f487e2": "Mysql",
  "5f92f2628c11891d27ff0f1f": "MsSQL",
  "5ff5af0851d64d5127abc597": "Redshift",
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

//  ---------- Styles ----------

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 20px 0px;
  margin: 20px 10px 0px;
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

  &:hover {
    background-color: ${(props) =>
      props.disabled ? Colors.GRAY_2 : Colors.WHITE};
    color: ${Colors.DOVE_GRAY2};
  }
`;

// ---------- Types ----------
interface DatasourceTableDropdownOption extends DropdownOption {
  data: DatasourceTable;
}
type DropdownOptions = Array<DropdownOption>;

// ---------- GeneratePageForm Component ----------

function GeneratePageForm() {
  const dispatch = useDispatch();
  const plugins = useSelector(getPlugins);
  const {
    applicationId: currentApplicationId,
    pageId: currentPageId,
  } = useParams<ExplorerURLParams>();

  const datasources: Datasource[] = useSelector(getDatasources);
  const datasourcesStructure: Record<string, DatasourceStructure> = useSelector(
    getDatasourcesStructure,
  );

  const [dataSourceOptions, setDataSourceOptions] = useState<DropdownOptions>(
    [],
  );
  const [datasourceTableOptions, setDatasourceTableOptions] = useState<
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

  const [selectedColumn, selectColumn] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const onSelectDataSource = (
    datasource: string | undefined,
    dataSourceObj: DropdownOption | undefined,
  ) => {
    if (datasource && dataSourceObj) {
      selectDataSource(dataSourceObj);
      selectTable(DEFAULT_DROPDOWN_OPTION);
      selectColumn(DEFAULT_DROPDOWN_OPTION);
      if (dataSourceObj.id) {
        dispatch(fetchDatasourceStructure(dataSourceObj.id));
      }
    }
  };

  const onSelectTable = (
    table: string | undefined,
    TableObj: DatasourceTableDropdownOption,
  ) => {
    if (table && TableObj) {
      selectTable(TableObj);
      selectColumn(DEFAULT_DROPDOWN_OPTION);
      const { data } = TableObj;
      if (data.columns) {
        const newSelectedTableColumnOptions: DropdownOption[] = [];
        data.columns.map((column) => {
          if (column.type === "text") {
            newSelectedTableColumnOptions.push({
              id: column.name,
              label: column.name,
              value: column.name,
              subText: column.type,
            });
          }
        });
        if (newSelectedTableColumnOptions.length) {
          setSelectedTableColumnOptions(newSelectedTableColumnOptions);
        }
      }
    }
  };

  const onSelectColumn = (
    table: string | undefined,
    ColumnObj: DropdownOption | undefined,
  ) => {
    if (table && ColumnObj) {
      selectColumn(ColumnObj);
    }
  };

  const handleFormSubmit = () => {
    //  TODO :- find solution to avoid empty string
    dispatch(
      generateTemplateToUpdatePage({
        applicationId: currentApplicationId || "",
        pageId: currentPageId || "",
        columns: [],
        columnName: selectedColumn.value,
        tableName: selectedTable.value || "",
        datasourceId: selectedDatasource.id || "",
      }),
    );
  };

  const routeToCreateNewDatasource = () => {
    history.push(
      `${INTEGRATION_EDITOR_URL(
        currentApplicationId,
        currentPageId,
        INTEGRATION_TABS.NEW,
      )}?previousRoute=generate-page-form`,
    );
  };

  useEffect(() => {
    const newDataSourceOptions = [];
    console.log({ datasources, plugins });
    datasources.forEach(({ id, isValid, name, organizationId, pluginId }) => {
      if (VALID_PLUGINS_FOR_TEMPLATE[pluginId])
        newDataSourceOptions.push({
          id,
          label: name,
          value: name,
          data: {
            isValid,
            organizationId,
            pluginId,
          },
        });
    });
    newDataSourceOptions.unshift(
      {
        id: CONNECT_NEW_DATASOURCE_OPTION_ID,
        label: "Connect New Datasource",
        value: "Connect New Datasource",
        data: {
          isValid: false,
          organizationId: "",
          pluginId: "",
        },
      },
      {
        id: MOCK_DATABASES_OPTION_ID,
        label: "Mock Databases ------------",
        value: "Mock Databases ------------",
        data: {
          isValid: false,
          organizationId: "",
          pluginId: "",
        },
      },
    );
    setDataSourceOptions(newDataSourceOptions);
  }, [datasources, setDataSourceOptions]);

  useEffect(() => {
    if (selectedDatasource.id) {
      const selectedDatasourceStructure =
        datasourcesStructure[selectedDatasource.id];

      const tables = selectedDatasourceStructure?.tables;
      if (tables?.length) {
        const newTables = tables.map(({ columns, name }) => ({
          id: name,
          label: name,
          value: name,
          data: {
            columns,
          },
        }));
        setDatasourceTableOptions(newTables);
      }
    }
  }, [datasourcesStructure, selectedDatasource, setDatasourceTableOptions]);

  return (
    <div>
      <Wrapper>
        <IconWrapper>
          <RoundBg>
            <Icon
              fillColor={Colors.GRAY2}
              hoverFillColor={Colors.GRAY2}
              name="wand"
              size={IconSize.MEDIUM}
            />
          </RoundBg>
        </IconWrapper>
        <DescWrapper>
          <Title>Generate from Data</Title>
          <SubTitle>
            Connect datasource and generate the application automatically.
          </SubTitle>
        </DescWrapper>
      </Wrapper>
      <FormWrapper>
        <SelectWrapper>
          <Label>Select Datasource</Label>
          <Dropdown
            height={DROPDOWN_DIMENSION.HEIGHT}
            onSelect={onSelectDataSource}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={dataSourceOptions}
            renderOption={({ isSelected, option, optionClickHandler }) => (
              <DataSourceOption
                extraProps={{ routeToCreateNewDatasource }}
                isSelected={isSelected}
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
          <SelectWrapper>
            <Label>
              Select Table from <span>{selectedDatasource.label}</span>
            </Label>
            <Dropdown
              height={DROPDOWN_DIMENSION.HEIGHT}
              onSelect={onSelectTable}
              optionWidth={DROPDOWN_DIMENSION.WIDTH}
              options={datasourceTableOptions}
              selected={selectedTable}
              showLabelOnly
              width={DROPDOWN_DIMENSION.WIDTH}
            />
          </SelectWrapper>
        ) : null}
        {selectedTable.value ? (
          <SelectWrapper>
            <Label>Select Column from {selectedTable.label}</Label>
            <Dropdown
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
        {selectedTable.value ? (
          <FormSubmitButton
            category={Category.secondary}
            data-cy="generate-page-form-submit"
            disabled={!selectedTable.value}
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
