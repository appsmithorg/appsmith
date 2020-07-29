import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Icon, InputGroup } from "@blueprintjs/core";
import CustomizedDropdown from "pages/common/CustomizedDropdown";
import { Directions } from "utils/helpers";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import { Skin } from "constants/DefaultTheme";
import { ColumnTypes } from "components/designSystems/appsmith/ReactTableComponent";
import AutoToolTipComponent from "components/designSystems/appsmith/AutoToolTipComponent";
import DatePickerComponent from "components/designSystems/blueprint/DatePickerComponent";
import {
  DropdownOption,
  ReactTableFilter,
  Condition,
} from "components/designSystems/appsmith/TableFilters";

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
  color: ${Colors.BLUE_BAYOUX};
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
  background: ${Colors.WHITE};
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 4px;
  margin-left: 10px;
  font-size: 14px;
  padding: 5px 12px 7px;
  color: ${Colors.OXFORD_BLUE};
`;

const StyledInputGroup = styled(InputGroup)`
  background: ${Colors.WHITE};
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 4px;
  color: ${Colors.OXFORD_BLUE};
  height: 32px;
  width: 100px;
  margin-left: 10px;
  input {
    box-shadow: none;
  }
`;

const DatePickerWrapper = styled.div`
  margin-left: 10px;
  width: 100px;
`;

const DropdownTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  &&& div {
    width: 100%;
    color: ${Colors.OXFORD_BLUE};
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
  [ColumnTypes.TEXT]: [
    { label: "contains", value: "contains", type: "input" },
    { label: "does not contain", value: "doesNotContain", type: "input" },
    { label: "starts with", value: "startsWith", type: "input" },
    { label: "ends with", value: "endsWith", type: "input" },
    { label: "is exactly", value: "isExactly", type: "input" },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  [ColumnTypes.DATE]: [
    { label: "is", value: "is", type: "date" },
    { label: "is before", value: "isBefore", type: "date" },
    { label: "is after", value: "isAfter", type: "date" },
    // { label: "is within", value: "isWithin", type: "date" },
    { label: "is not", value: "isNot", type: "date" },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  [ColumnTypes.IMAGE]: [
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  [ColumnTypes.VIDEO]: [
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  [ColumnTypes.TIME]: [
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  [ColumnTypes.CURRENCY]: [
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

export type Operator = "or" | "and";

export const operators: { [key: string]: Operator } = {
  or: "or",
  and: "and",
};

const operatorOptions: DropdownOption[] = [
  { label: "or", value: "or", type: "" },
  { label: "and", value: "and", type: "" },
];

const dateOptions: DropdownOption[] = [
  { label: "today", value: "today", type: "" },
  { label: "tomorrow", value: "tomorrow", type: "" },
  { label: "yesterday", value: "yesterday", type: "" },
  { label: "past week", value: "last_week", type: "" },
  { label: "past month", value: "last_month", type: "" },
  { label: "past year", value: "last_year", type: "" },
  { label: "exact date", value: "exact", type: "date_input" },
];

const RenderOptions = (props: {
  columns: DropdownOption[];
  selectItem: (column: DropdownOption) => void;
  placeholder: string;
  value?: string | Condition;
}) => {
  const [selectedValue, selectValue] = useState(props.placeholder);
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
          <Icon icon="chevron-down" iconSize={16} color={Colors.SLATE_GRAY} />
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

type CascadeFieldProps = {
  columns: DropdownOption[];
  column: string;
  condition: Condition;
  value: any;
  operator: Operator;
  index: number;
  applyFilter: (filter: ReactTableFilter, index: number) => void;
  removeFilter: (index: number) => void;
};

type CascadeFieldState = {
  column: string;
  condition: Condition;
  value: any;
  operator: Operator;
  conditions: DropdownOption[];
  showInput: boolean;
  showDateDropdown: boolean;
  showDateInput: boolean;
  isDeleted: boolean;
  isUpdate: boolean;
};

const getConditions = (props: CascadeFieldProps) => {
  const columnValue = props.column || "";
  const filteredColumn = props.columns.filter((column: DropdownOption) => {
    return columnValue === column.value;
  });
  if (filteredColumn.length) {
    return typeOperatorsMap[filteredColumn[0].type];
  } else {
    return new Array<DropdownOption>(0);
  }
};

const showDateDropdownField = (
  props: CascadeFieldProps,
  conditions: DropdownOption[],
) => {
  const conditionValue = props.condition || "";
  const filteredConditions =
    conditions &&
    conditions.filter((condition: DropdownOption) => {
      return condition.value === conditionValue;
    });
  return !!filteredConditions.length && filteredConditions[0].type === "date";
};

const showInputField = (
  props: CascadeFieldProps,
  conditions: DropdownOption[],
) => {
  const conditionValue = props.condition || "";
  const filteredConditions =
    conditions &&
    conditions.filter((condition: DropdownOption) => {
      return condition.value === conditionValue;
    });
  return !!filteredConditions.length && filteredConditions[0].type === "input";
};

const showDateInputField = (
  props: CascadeFieldProps,
  conditions: DropdownOption[],
) => {
  const conditionValue = props.condition || "";
  const filterValue = props.value || "";
  // const isExactDate =
  //   dateOptions.filter((item: DropdownOption) => {
  //     return item.value === filterValue;
  //   }).length === 0 || filterValue === "exact";
  const filteredConditions =
    conditions &&
    conditions.filter((condition: DropdownOption) => {
      return condition.value === conditionValue;
    });
  return (
    !!filteredConditions.length && filteredConditions[0].type === "date" //&& isExactDate
  );
};

function calculateInitialState(props: CascadeFieldProps) {
  const conditions = getConditions(props);
  const showInput = showInputField(props, conditions);
  // const showDateDropdown = showDateDropdownField(props, conditions);
  const showDateInput = showDateInputField(props, conditions);
  return {
    operator: props.operator,
    column: props.column,
    condition: props.condition,
    value: props.value,
    conditions: conditions,
    showInput: showInput,
    showDateDropdown: false,
    showDateInput: showDateInput,
    isDeleted: false,
    isUpdate: false,
  };
}

export enum CascadeFieldActionTypes {
  SELECT_COLUMN = "SELECT_COLUMN",
  SELECT_CONDITION = "SELECT_CONDITION",
  CHANGE_VALUE = "CHANGE_VALUE",
  SELECT_DATE = "SELECT_DATE",
  SELECT_OPERATOR = "SELECT_OPERATOR",
  UPDATE_FILTER = "UPDATE_FILTER",
  DELETE_FILTER = "DELETE_FILTER",
}

type CascadeFieldAction =
  | "SELECT_COLUMN"
  | "SELECT_CONDITION"
  | "CHANGE_VALUE"
  | "SELECT_DATE"
  | "SELECT_OPERATOR"
  | "UPDATE_FILTER"
  | "DELETE_FILTER";

function CaseCaseFieldReducer(
  state: CascadeFieldState,
  action: {
    type: CascadeFieldAction;
    payload?: any;
  },
) {
  switch (action.type) {
    case CascadeFieldActionTypes.SELECT_COLUMN:
      return {
        ...state,
        column: action.payload.value,
        conditions: typeOperatorsMap[action.payload.type],
        isUpdate: true,
      };
    case CascadeFieldActionTypes.SELECT_CONDITION:
      return {
        ...state,
        condition: action.payload.value,
        showInput: action.payload.type === "input",
        // showDateDropdown: action.payload.type === "date",
        showDateInput: action.payload.type === "date",
        value: action.payload.type === "" ? "" : state.value,
        isUpdate: true,
      };
    case CascadeFieldActionTypes.CHANGE_VALUE:
      return {
        ...state,
        value: action.payload,
        isUpdate: true,
      };
    case CascadeFieldActionTypes.SELECT_DATE:
      return {
        ...state,
        value: action.payload,
        showDateInput: action.payload === "exact",
        isUpdate: true,
      };
    case CascadeFieldActionTypes.SELECT_OPERATOR:
      return {
        ...state,
        operator: action.payload,
        isUpdate: true,
      };
    case CascadeFieldActionTypes.UPDATE_FILTER:
      const calculatedState = calculateInitialState(action.payload);
      return {
        ...calculatedState,
        isUpdate: false,
      };
    case CascadeFieldActionTypes.DELETE_FILTER:
      return {
        ...state,
        isDeleted: true,
      };
    default:
      throw new Error();
  }
}

const CascadeField = (props: CascadeFieldProps) => {
  const memoizedState = React.useMemo(() => calculateInitialState(props), [
    JSON.stringify(props),
  ]);
  return <Fields state={memoizedState} {...props} />;
};
const Fields = (props: CascadeFieldProps & { state: CascadeFieldState }) => {
  const [state, dispatch] = React.useReducer(CaseCaseFieldReducer, props.state);
  const removeFilter = () => {
    dispatch({ type: CascadeFieldActionTypes.DELETE_FILTER });
  };
  const selectColumn = (column: DropdownOption) => {
    dispatch({
      type: CascadeFieldActionTypes.SELECT_COLUMN,
      payload: column,
    });
  };
  const selectCondition = (condition: DropdownOption) => {
    dispatch({
      type: CascadeFieldActionTypes.SELECT_CONDITION,
      payload: condition,
    });
  };
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: CascadeFieldActionTypes.CHANGE_VALUE,
      payload: event.target.value,
    });
  };
  const selectDateOption = (option: DropdownOption) => {
    dispatch({
      type: CascadeFieldActionTypes.SELECT_DATE,
      payload: option.value,
    });
  };
  const onDateSelected = (date: string) => {
    dispatch({
      type: CascadeFieldActionTypes.CHANGE_VALUE,
      payload: date,
    });
  };
  const selectOperator = (option: DropdownOption) => {
    dispatch({
      type: CascadeFieldActionTypes.SELECT_OPERATOR,
      payload: operators[option.value],
    });
  };

  useEffect(() => {
    const { operator, column, condition, value, isDeleted, isUpdate } = state;
    if (!isDeleted && isUpdate) {
      props.applyFilter({ operator, column, condition, value }, props.index);
    } else if (isDeleted) {
      props.removeFilter(props.index);
    }
  }, [state]);

  useEffect(() => {
    dispatch({
      type: CascadeFieldActionTypes.UPDATE_FILTER,
      payload: props,
    });
  }, [props]);

  const {
    operator,
    column,
    condition,
    value,
    showInput,
    showDateInput,
    showDateDropdown,
    conditions,
  } = state;
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
            value={operator}
            placeholder="or"
          />
        </DropdownWrapper>
      ) : (
        <LabelWrapper>
          {props.index === 0 ? "Where" : props.operator}
        </LabelWrapper>
      )}
      <DropdownWrapper width={150}>
        <RenderOptions
          columns={props.columns}
          selectItem={selectColumn}
          value={column}
          placeholder="Attribute"
        />
      </DropdownWrapper>
      <DropdownWrapper width={120}>
        <RenderOptions
          columns={conditions}
          selectItem={selectCondition}
          value={condition}
          placeholder="Is"
        />
      </DropdownWrapper>
      {showInput ? (
        <StyledInputGroup
          placeholder="Enter value"
          onChange={onValueChange}
          type="text"
          defaultValue={value}
        />
      ) : null}
      {showDateDropdown ? (
        <DropdownWrapper width={120}>
          <RenderOptions
            columns={dateOptions}
            selectItem={selectDateOption}
            value={value}
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
            selectedDate={value}
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

export default CascadeField;
