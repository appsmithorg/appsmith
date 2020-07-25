import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Icon, InputGroup } from "@blueprintjs/core";
import CustomizedDropdown from "pages/common/CustomizedDropdown";
import { Directions } from "utils/helpers";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import { Skin } from "constants/DefaultTheme";
import AutoToolTipComponent from "components/designSystems/appsmith/AutoToolTipComponent";
import DatePickerComponent from "components/designSystems/blueprint/DatePickerComponent";
import {
  DropdownOption,
  ReactTableFilter,
} from "components/designSystems/appsmith/TableFilters";
import moment from "moment";

const StyledRemoveIcon = styled(
  ControlIcons.REMOVE_CONTROL as AnyStyledComponent,
)`
  padding: 0;
  position: relative;
  cursor: pointer;
`;

const LabelWrapper = styled.div`
  width: 85px;
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
  margin-left: 10px;
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
  margin-left: 10px;
  input {
    box-shadow: none;
  }
`;

const DatePickerWrapper = styled.div`
  margin-left: 10px;
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
    margin-right: 5px;
  }
  &&& span {
    margin-right: 0;
  }
`;

const typeOperatorsMap: { [key: string]: DropdownOption[] } = {
  text: [
    { label: "contains", value: "contains", type: "input" },
    { label: "does not contain", value: "doesNotContain", type: "input" },
    { label: "starts with", value: "startsWith", type: "input" },
    { label: "ends with", value: "endsWith", type: "input" },
    { label: "is exactly", value: "isExactly", type: "input" },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  date: [
    { label: "is", value: "is", type: "date" },
    { label: "is before", value: "isBefore", type: "date" },
    { label: "is after", value: "isAfter", type: "date" },
    { label: "is within", value: "isWithin", type: "date" },
    { label: "is not", value: "isNot", type: "date" },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  image: [
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  currency: [
    { label: "is equal to", value: "isEqualTo", type: "input" },
    { label: "not equal to", value: "notEqualTo", type: "input" },
    { label: "greater than", value: "greaterThan", type: "input" },
    {
      label: "greater than or equal to",
      value: "greaterThanEqualTo",
      type: "input",
    },
    { label: "less than", value: "lessThan", type: "input" },
    {
      label: "less than or equal to",
      value: "lessThanEqualTo",
      type: "input",
    },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
};

function getDateRange(b: any) {
  let startDate, endDate;
  switch (b) {
    case "today":
      startDate = moment();
      endDate = moment();
      break;
    case "tomorrow":
      startDate = moment().add(1, "d");
      endDate = moment().add(1, "d");
      break;
    case "yesterday":
      startDate = moment().subtract(1, "d");
      endDate = moment().subtract(1, "d");
      break;
    case "last_week":
      startDate = moment()
        .subtract(1, "weeks")
        .startOf("week");
      endDate = moment()
        .subtract(1, "weeks")
        .endOf("week");
      break;
    case "last_month":
      startDate = moment()
        .subtract(1, "month")
        .startOf("month");
      endDate = moment()
        .subtract(1, "month")
        .endOf("month");
      break;
    case "last_year":
      startDate = moment()
        .subtract(1, "year")
        .startOf("year");
      endDate = moment()
        .subtract(1, "year")
        .startOf("year");
      break;
  }
  return {
    startDate,
    endDate,
  };
}

const ConditionFunctions: { [key: string]: (a: any, b: any) => boolean } = {
  isExactly: (a: any, b: any) => {
    return a === b;
  },
  empty: (a: any) => {
    return a === "" || a === undefined || a === null;
  },
  notEmpty: (a: any) => {
    return a !== "" && a !== undefined && a !== null;
  },
  notEqualTo: (a: any, b: any) => {
    return a !== b;
  },
  lessThan: (a: any, b: any) => {
    return a < b;
  },
  lessThanEqualTo: (a: any, b: any) => {
    return a <= b;
  },
  greaterThan: (a: any, b: any) => {
    return a > b;
  },
  greaterThanEqualTo: (a: any, b: any) => {
    return a >= b;
  },
  contains: (a: any, b: any) => {
    return a.includes(b);
  },
  doesNotContain: (a: any, b: any) => {
    return !a.includes(b);
  },
  startsWith: (a: any, b: any) => {
    return a.indexOf(b) === 0;
  },
  endsWith: (a: any, b: any) => {
    return a.indexOf(b) + b.legnth === a.length;
  },
  is: (a: any, b: any) => {
    const { startDate } = getDateRange(b);
    return moment(a).isSame(startDate, "d");
  },
  isNot: (a: any, b: any) => {
    const { startDate } = getDateRange(b);
    return !moment(a).isSame(startDate, "d");
  },
  isWithin: (a: any, b: any) => {
    const { startDate, endDate } = getDateRange(b);
    console.log(moment(a), startDate, endDate);
    return moment(a).isBetween(startDate, endDate, "d");
  },
  isAfter: (a: any, b: any) => {
    const { endDate } = getDateRange(b);
    return !moment(a).isAfter(endDate, "d");
  },
  isBefore: (a: any, b: any) => {
    const { startDate } = getDateRange(b);
    return !moment(a).isBefore(startDate, "d");
  },
};

export type Condition = keyof typeof ConditionFunctions;

const operators: { [key: string]: string } = {
  or: "or",
  and: "and",
};

const operatorOptions: DropdownOption[] = [
  { label: "or", value: "or", type: "" },
  { label: "and", value: "and", type: "" },
];

export type Operator = keyof typeof operators;

// | "today"
// | "tomorrow"
// | "yesterday"
// | "last_week"
// | "last_month"
// | "last_year"
// | "exact";

const dateOptions: DropdownOption[] = [
  { label: "today", value: "today", type: "" },
  { label: "tomorrow", value: "tomorrow", type: "" },
  { label: "yesterday", value: "yesterday", type: "" },
  { label: "past week", value: "last_week", type: "" },
  { label: "past month", value: "last_month", type: "" },
  { label: "past year", value: "last_year", type: "" },
  { label: "exact date", value: "exact", type: "date_input" },
];

export function compare(a: any, b: any, condition: Condition) {
  const conditionFunction = ConditionFunctions[condition];
  if (conditionFunction) {
    return conditionFunction(a, b);
  } else {
    return true;
  }
}

const RenderOptions = (props: {
  columns: DropdownOption[];
  selectItem: (column: DropdownOption) => void;
  placeholder: string;
  value?: string | Condition;
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
            active: column.value === props.value,
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
          <div>
            <AutoToolTipComponent title={selectedValue}>
              {selectedValue}
            </AutoToolTipComponent>
          </div>
          <Icon icon="chevron-down" iconSize={16} color="#768896" />
        </DropdownTrigger>
      ),
    },
    skin: Skin.LIGHT,
  };
  useEffect(() => {
    if (props.value && configs.sections[0].options) {
      const selectedOptions = configs.sections[0].options.filter(
        i => i.value === props.value,
      );
      if (selectedOptions && selectedOptions.length) {
        selectValue(selectedOptions[0].content);
      }
    }
  }, [props.value]);
  return <CustomizedDropdown {...configs} />;
};

const defaultFilter: ReactTableFilter = {
  column: "",
  condition: "",
  value: "",
  operator: "",
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
  const getConditions = () => {
    const columnValue = (props.filter || defaultFilter).column;
    const filteredColumn = props.columns.filter((column: DropdownOption) => {
      return columnValue === column.value;
    });
    if (filteredColumn.length) {
      return typeOperatorsMap[filteredColumn[0].type];
    } else {
      return new Array<DropdownOption>(0);
    }
  };
  const [conditions, setConditions] = React.useState(getConditions());
  const showInputField = () => {
    const conditionValue = (props.filter || defaultFilter).condition;
    const filteredConditions =
      conditions &&
      conditions.filter((condition: DropdownOption) => {
        return condition.value === conditionValue;
      });
    return filteredConditions.length && filteredConditions[0].type === "input";
  };
  const [showInput, toggleInput] = React.useState(showInputField());
  const showDateDropdownField = () => {
    const conditionValue = (props.filter || defaultFilter).condition;
    const filteredConditions =
      conditions &&
      conditions.filter((condition: DropdownOption) => {
        return condition.value === conditionValue;
      });
    return filteredConditions.length && filteredConditions[0].type === "date";
  };
  const [showDateDropdown, toggleDateDropDown] = React.useState(
    showDateDropdownField(),
  );
  const showDateInputField = () => {
    const conditionValue = (props.filter || defaultFilter).condition;
    const filterValue = (props.filter || defaultFilter).value;
    const isExactDate =
      dateOptions.filter((item: DropdownOption) => {
        return item.value === filterValue;
      }).length === 0;
    const filteredConditions =
      conditions &&
      conditions.filter((condition: DropdownOption) => {
        return condition.value === conditionValue;
      });
    return (
      filteredConditions.length &&
      filteredConditions[0].type === "date" &&
      isExactDate
    );
  };
  const [showDateInput, toggleShowDateInput] = React.useState(
    showDateInputField(),
  );
  const removeFilter = () => {
    props.removeFilter(props.index);
  };
  const selectColumn = (column: DropdownOption) => {
    filter.column = column.value;
    if (column.type && typeOperatorsMap[column.type]) {
      setConditions(typeOperatorsMap[column.type]);
    }
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const selectCondition = (condition: DropdownOption) => {
    filter.condition = condition.value;
    toggleInput(condition.type === "input");
    toggleDateDropDown(condition.type === "date");
    if (condition.type !== "date") {
      toggleShowDateInput(false);
    }
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    filter.value = value;
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const selectDateOption = (option: DropdownOption) => {
    filter.value = option.value;
    toggleShowDateInput(option.value === "exact");
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const onDateSelected = (date: string) => {
    filter.value = date;
    updateFilter(filter);
    props.applyFilter(filter, props.index);
  };
  const selectOperator = (option: DropdownOption) => {
    filter.operator = option.value;
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
      {props.index === 1 ? (
        <DropdownWrapper width={75}>
          <RenderOptions
            columns={operatorOptions}
            selectItem={selectOperator}
            value={filter.operator}
            placeholder="or"
          />
        </DropdownWrapper>
      ) : (
        <LabelWrapper>Where</LabelWrapper>
      )}
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
          columns={conditions}
          selectItem={selectCondition}
          value={filter.condition}
          placeholder="Is"
        />
      </DropdownWrapper>
      {showInput ? (
        <StyledInputGroup
          placeholder="Enter value"
          onChange={onValueChange}
          type="text"
          defaultValue={filter.value}
        />
      ) : null}
      {showDateDropdown ? (
        <DropdownWrapper width={120}>
          <RenderOptions
            columns={dateOptions}
            selectItem={selectDateOption}
            value={filter.value}
            placeholder="date"
          />
        </DropdownWrapper>
      ) : null}
      {showDateInput ? (
        <DatePickerWrapper>
          <DatePickerComponent
            label=""
            dateFormat="DD/MM/YYYY"
            datePickerType="DATE_PICKER"
            onDateSelected={onDateSelected}
            selectedDate={filter.value}
            isDisabled={false}
            isLoading={false}
            enableTimePicker={false}
            widgetId=""
          />
        </DatePickerWrapper>
      ) : null}
    </FieldWrapper>
  );
};

export default CascadeFields;
