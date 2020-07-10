import React, { useState, useEffect } from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
  Icon,
  InputGroup,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as FilterIcon } from "assets/icons/control/filter-icon.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import Button from "components/editorComponents/Button";
import CustomizedDropdown, {
  CustomizedDropdownProps,
} from "pages/common/CustomizedDropdown";
import { Directions } from "utils/helpers";
import { Theme, Skin } from "constants/DefaultTheme";

const TableIconWrapper = styled.div<{ selected: boolean }>`
  background: ${props => (props.selected ? Colors.ATHENS_GRAY : "transparent")};
  box-shadow: ${props =>
    props.selected ? `inset 0px 4px 0px ${Colors.GREEN}` : "none"};
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items; center;
  height: 40px;
  box-sizing: border-box;
  min-width: 224px;
  padding: 5px 15px;
  background: ${Colors.WHITE};
  box-shadow: 0px -1px 2px rgba(67, 70, 74, 0.12);
  margin-top: 20px;
`;

const TableFilerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const LabelWrapper = styled.div`
  width: 100%;
  text-align: left;
  margin-left: 16px;
  margin-top: 20px;
  color: #4e5d78;
  font-size: 14px;
  font-weight: 500;
`;

const FieldWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 4px;
  margin-right: 16px;
`;

const DropdownWrapper = styled.div`
  width: 192px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 4px;
  margin-left: 16px;
  font-size: 14px;
  padding: 5px 12px 7px;
  color: #2e3d49;
`;

const ValueWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 16px;
  margin-left: 16px;
`;

const StyledInputGroup = styled(InputGroup)`
  background: #ffffff;
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 4px;
  color: #2e3d49;
  height: 32px;
  width: 232px;
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
  const [selectedValue, selectValue] = useState("Attribute");
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
interface TableFilterProps {
  columns: ReactTableColumnProps[];
  filter?: ReactTableFilter;
  applyFilter: (filter: ReactTableFilter) => void;
}

const defaultFilter: ReactTableFilter = {
  column: "",
  operator: "",
  value: "",
};

const TableFilters = (props: TableFilterProps) => {
  const [selected, selectMenu] = React.useState(false);
  const [filter, updateFilter] = React.useState(props.filter || defaultFilter);
  const applyFilters = () => {
    console.log("applying filters");
    props.applyFilter(filter);
    selectMenu(false);
  };
  const selectColumn = (column: string) => {
    console.log("selected column", column);
    filter.column = column;
    updateFilter(filter);
  };
  const selectOperator = (operator: string) => {
    console.log("selected operator", operator);
    filter.operator = operator;
    updateFilter(filter);
  };
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log("selected value", value);
    filter.value = value;
    updateFilter(filter);
  };
  return (
    <Popover
      minimal
      usePortal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
      onClose={() => {
        selectMenu(false);
      }}
      isOpen={selected}
    >
      <TableIconWrapper
        selected={selected}
        onClick={e => {
          selectMenu(true);
          e.stopPropagation();
        }}
      >
        <IconWrapper
          width={20}
          height={20}
          color={selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
        >
          <FilterIcon />
        </IconWrapper>
      </TableIconWrapper>
      <TableFilerWrapper
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <LabelWrapper>Where</LabelWrapper>
        <FieldWrapper>
          <DropdownWrapper>
            <RenderColumnOptions
              columns={props.columns}
              selectColumn={selectColumn}
              value={filter.column}
            />
          </DropdownWrapper>
          <DropdownWrapper>
            <RenderOperatorOptions
              selectOperator={selectOperator}
              value={filter.operator}
            />
          </DropdownWrapper>
        </FieldWrapper>
        <ValueWrapper>
          <StyledInputGroup
            placeholder="Enter value"
            onChange={onValueChange}
            type="text"
            defaultValue={filter.value}
          />
        </ValueWrapper>
        <ButtonWrapper className={Classes.POPOVER_DISMISS}>
          <Button
            intent="primary"
            text="Filter"
            filled
            size="small"
            onClick={() => {
              applyFilters();
            }}
          />
        </ButtonWrapper>
      </TableFilerWrapper>
    </Popover>
  );
};

export default TableFilters;
