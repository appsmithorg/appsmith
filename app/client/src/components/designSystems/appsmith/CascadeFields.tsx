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
    color: #2e3d49;
  }
  &&& span {
    margin-right: 0;
  }
`;

const RenderColumnOptions = (props: {
  columns: ReactTableColumnProps[];
  selectColumn: (column: string) => void;
  value?: string;
}) => {
  const [selectedValue, selectValue] = useState("Attribute");
  const options = props.columns.map(
    (column: ReactTableColumnProps, index: number) => {
      return {
        content: column.Header,
        value: column.accessor,
        onSelect: () => {
          selectValue(column.Header);
          props.selectColumn(column.accessor);
        },
      };
    },
  );
  const configs = {
    sections: [
      {
        options: options,
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
    if (props.value) {
      const selectedOption = configs.sections[0].options.filter(
        i => i.value === props.value,
      );
      selectValue(selectedOption[0].content);
    }
  }, [props.value]);
  return <CustomizedDropdown {...configs} />;
};

const RenderOperatorOptions = (props: {
  selectOperator: (operator: string) => void;
  value?: string;
}) => {
  const [selectedValue, selectValue] = useState("Is");
  const configs = {
    sections: [
      {
        options: [
          {
            content: "Is",
            value: "is",
            onSelect: () => {
              selectValue("Is");
              props.selectOperator("is");
            },
          },
          {
            content: "Is Not",
            value: "is_not",
            onSelect: () => {
              selectValue("Is Not");
              props.selectOperator("is_not");
            },
          },
        ],
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
    if (props.value) {
      const selectedOption = configs.sections[0].options.filter(
        i => i.value === props.value,
      );
      selectValue(selectedOption[0].content);
    }
  }, [props.value]);
  return <CustomizedDropdown {...configs} />;
};

export interface ReactTableFilter {
  column: string;
  operator: string;
  value: any;
}

const defaultFilter: ReactTableFilter = {
  column: "",
  operator: "",
  value: "",
};

interface CascaseFieldProps {
  columns: ReactTableColumnProps[];
  filter?: ReactTableFilter;
  index: number;
  applyFilter: (filter: ReactTableFilter, index: number) => void;
  removeFilter: (index: number) => void;
}

const CascadeFields = (props: CascaseFieldProps) => {
  const [filter, updateFilter] = React.useState(props.filter || defaultFilter);
  const removeFilter = () => {
    props.removeFilter(props.index);
  };
  const selectColumn = (column: string) => {
    console.log("selected column", column);
    filter.column = column;
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const selectOperator = (operator: string) => {
    console.log("selected operator", operator);
    filter.operator = operator;
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log("selected value", value);
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
        <RenderColumnOptions
          columns={props.columns}
          selectColumn={selectColumn}
          value={filter.column}
        />
      </DropdownWrapper>
      <DropdownWrapper width={100}>
        <RenderOperatorOptions
          selectOperator={selectOperator}
          value={filter.operator}
        />
      </DropdownWrapper>
      <StyledInputGroup
        placeholder="Enter value"
        onChange={onValueChange}
        type="text"
        defaultValue={filter.value}
      />
    </FieldWrapper>
  );
};

export default CascadeFields;
