import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";
import Dropdown from "components/ads/Dropdown";
import { getTypographyByKey } from "../../../../constants/DefaultTheme";
import {
  IconWrapper,
  RoundBg,
  DescWrapper,
  Title,
  SubTitle,
} from "./commonStyle";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector } from "react-redux";
import { getDatasources } from "../../../../selectors/entitiesSelector";
import { Datasource } from "../../../../entities/Datasource/index";
import { DropdownOption } from "../../../../components/ads/Dropdown";

// ---------- Helpers and constants ----------

const getUniqueId = () => {
  return `id--${Math.random()
    .toString(16)
    .slice(2)}`;
};

const CONNECT_NEW_DATASOURCE_OPTION_ID = getUniqueId();

const DROPDOWN_DIMENSION = {
  HEIGHT: "36px",
  WIDTH: "404px",
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

type dropdownOptions = Array<DropdownOption>;

// ---------- Child Components ----------

const renderDataSourceOption = (dropdownOption: DropdownOption) => {
  if (CONNECT_NEW_DATASOURCE_OPTION_ID === dropdownOption.id) {
    return <div key={dropdownOption.id}> + {dropdownOption.label}</div>;
  }
  return <div key={dropdownOption.id}>{dropdownOption.label}</div>;
};

// ---------- GeneratePageForm Component ----------

function GeneratePageForm() {
  const datasources: Datasource[] = useSelector(getDatasources);

  const [dataSourceOptions, setDataSourceOptions] = useState<dropdownOptions>(
    [],
  );
  const [selectedDatasource, selectDataSource] = useState<DropdownOption>({
    id: "- Select -",
    label: "- Select -",
    value: "",
  });

  const [selectedTable, selectTable] = useState<DropdownOption>({
    id: "- Select -",
    label: "- Select -",
    value: "",
  });

  const onSelectDataSource = (datasource: string | undefined) => {
    console.log("Selected ", datasource);
    if (datasource) {
      // selectDataSource(datsource);
    }
  };

  const onSelectTable = (table: string | undefined) => {
    console.log("Selected ", table);
    if (table) {
      // selectDataSource(datsource);
    }
  };

  const handleFormSubmit = () => {
    console.log("FOrm sibmit");
  };

  useEffect(() => {
    const newDataSourceOptions = datasources.map(({ id, name }) => ({
      id,
      label: name,
      value: name,
    }));
    newDataSourceOptions.unshift({
      id: CONNECT_NEW_DATASOURCE_OPTION_ID,
      label: "Connect New Datasource",
      value: "Connect New Datasource",
    });
    setDataSourceOptions(newDataSourceOptions);
  }, [datasources]);

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
            renderOption={renderDataSourceOption}
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
              options={dataSourceOptions}
              selected={selectedTable}
              showLabelOnly
              width={DROPDOWN_DIMENSION.WIDTH}
            />
          </SelectWrapper>
        ) : null}
        {selectedTable.value ? (
          <SelectWrapper>
            <Label>Select Columns from {selectedTable.label}</Label>
            <Dropdown
              height={DROPDOWN_DIMENSION.HEIGHT}
              onSelect={onSelectDataSource}
              optionWidth={DROPDOWN_DIMENSION.WIDTH}
              options={dataSourceOptions}
              selected={selectedDatasource}
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
