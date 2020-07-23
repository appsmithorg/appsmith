import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Classes, Icon, InputGroup } from "@blueprintjs/core";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import CustomizedDropdown from "pages/common/CustomizedDropdown";
import { Directions } from "utils/helpers";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import { Skin } from "constants/DefaultTheme";
import {
  DropdownOption,
  ReactTableFilter,
} from "components/designSystems/appsmith/TableFilters";

const typeOperatorsMap: { [key: string]: DropdownOption[] } = {
  text: [
    {
      label: "contains",
      value: "contains",
      type: "input",
    },
    {
      label: "does not contain",
      value: "does_not_contain",
      type: "input",
    },
    {
      label: "starts with",
      value: "starts_with",
      type: "input",
    },
    {
      label: "ends with",
      value: "ends_with",
      type: "input",
    },
    {
      label: "is exactly",
      value: "starts_with",
      type: "input",
    },
    {
      label: "empty",
      value: "empty",
      type: "",
    },
    {
      label: "not empty",
      value: "not_empty",
      type: "",
    },
  ],
  date: [
    {
      label: "is",
      value: "is",
      type: "date",
    },
    {
      label: "is before",
      value: "is_before",
      type: "date",
    },
    {
      label: "is after",
      value: "is_after",
      type: "date",
    },
    {
      label: "is within",
      value: "is_within",
      type: "date_range",
    },
    {
      label: "is not",
      value: "is_not",
      type: "date",
    },
    {
      label: "empty",
      value: "empty",
      type: "",
    },
    {
      label: "not empty",
      value: "not_empty",
      type: "",
    },
  ],
  image: [
    {
      label: "empty",
      value: "empty",
      type: "",
    },
    {
      label: "not empty",
      value: "not_empty",
      type: "",
    },
  ],
  currency: [
    {
      label: "is equal to",
      value: "is_equal_to",
      type: "input",
    },
    {
      label: "not equal to",
      value: "not_equal_to",
      type: "input",
    },
    {
      label: "greater than",
      value: "greater_than",
      type: "input",
    },
    {
      label: "greater than or equal to",
      value: "greater_than_equal_to",
      type: "input",
    },
    {
      label: "less than",
      value: "less_than",
      type: "input",
    },
    {
      label: "less than or equal to",
      value: "less_than_equal_to",
      type: "input",
    },
    {
      label: "empty",
      value: "empty",
      type: "",
    },
    {
      label: "not empty",
      value: "not_empty",
      type: "",
    },
  ],
};

const StyledRemoveIcon = styled(
  ControlIcons.REMOVE_CONTROL as AnyStyledComponent,
)`
  padding: 0;
  position: relative;
  cursor: pointer;
`;

const LabelWrapper = styled.div`
  width: 64px;
  text-align: center;
  color: #4e5d78;
  font-size: 14px;
  font-weight: 500;
`;

const FieldWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 14px;
`;

const DropdownWrapper = styled.div<{ width: number }>`
  width: ${props => props.width}px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 4px;
  margin-right: 16px;
  font-size: 14px;
  padding: 5px 12px 7px;
  color: #2e3d49;
`;

const StyledInputGroup = styled(InputGroup)`
  background: #ffffff;
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 4px;
  color: #2e3d49;
  height: 32px;
  width: 100px;
  input {
    box-shadow: none;
  }
`;

const DropdownTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  &&& div {
    width: 100%;
    color: #2e3d49;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 10px;
  }
  &&& span {
    margin-right: 0;
  }
`;

const RenderOptions = (props: {
  columns: DropdownOption[];
  selectItem: (column: DropdownOption) => void;
  placeholder: string;
  value?: string;
}) => {
  const [selectedValue, selectValue] = useState(props.placeholder);
  console.log("columns", props.columns);
  const configs = {
    sections: [
      {
        options: props.columns.map((column: DropdownOption) => {
          return {
            content: column.label,
            value: column.value,
            onSelect: () => {
              selectValue(column.label);
              props.selectItem(column);
            },
          };
        }),
      },
    ],
    openDirection: Directions.DOWN,
    trigger: {
      content: (
        <DropdownTrigger>
          <div>{selectedValue}</div>
          <Icon icon="chevron-down" iconSize={16} color="#768896" />
        </DropdownTrigger>
      ),
    },
    skin: Skin.LIGHT,
  };
  useEffect(() => {
    if (props.value && configs.sections[0].options) {
      const selectedOption = configs.sections[0].options.filter(
        i => i.value === props.value,
      );
      console.log("selectedOption", selectedOption);
      // if (selectedOption && selectedOption.length) {
      //   selectValue(selectedOption[0].content);
      // }
    }
  }, [props.value]);
  return <CustomizedDropdown {...configs} />;
};

const defaultFilter: ReactTableFilter = {
  column: "",
  operator: "",
  value: "",
};

interface CascaseFieldProps {
  columns: DropdownOption[];
  filter?: ReactTableFilter;
  index: number;
  applyFilter: (filter: ReactTableFilter, index: number) => void;
  removeFilter: (index: number) => void;
}

const CascadeFields = (props: CascaseFieldProps) => {
  const [filter, updateFilter] = React.useState(props.filter || defaultFilter);
  const [showInput, toggleInput] = React.useState(true);
  const [operators, setOperators] = React.useState(
    new Array<DropdownOption>(0),
  );
  const removeFilter = () => {
    props.removeFilter(props.index);
  };
  const selectColumn = (column: DropdownOption) => {
    filter.column = column.value;
    if (column.type && typeOperatorsMap[column.type]) {
      setOperators(typeOperatorsMap[column.type]);
    }
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const selectOperator = (operator: DropdownOption) => {
    filter.operator = operator.value;
    toggleInput(operator.type === "input");
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    filter.value = value;
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  return (
    <FieldWrapper>
      <StyledRemoveIcon
        onClick={removeFilter}
        height={16}
        width={16}
        color="#4A545B"
      />
      <LabelWrapper>Where</LabelWrapper>
      <DropdownWrapper width={150}>
        <RenderOptions
          columns={props.columns}
          selectItem={selectColumn}
          value={filter.column}
          placeholder="Attribute"
        />
      </DropdownWrapper>
      <DropdownWrapper width={100}>
        <RenderOptions
          columns={operators}
          selectItem={selectOperator}
          value={filter.operator}
          placeholder="Is"
        />
      </DropdownWrapper>
      {showInput && (
        <StyledInputGroup
          placeholder="Enter value"
          onChange={onValueChange}
          type="text"
          defaultValue={filter.value}
        />
      )}
    </FieldWrapper>
  );
};

export default CascadeFields;
