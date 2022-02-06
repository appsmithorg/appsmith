import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Icon, InputGroup } from "@blueprintjs/core";
import { debounce } from "lodash";
import { AnyStyledComponent } from "styled-components";

import CustomizedDropdown from "pages/common/CustomizedDropdown";
import { Directions } from "utils/helpers";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";
import { Skin } from "constants/DefaultTheme";
import AutoToolTipComponent from "widgets/TableWidget/component/AutoToolTipComponent";
import {
  OperatorTypes,
  Condition,
  ColumnTypes,
  Operator,
  ReactTableFilter,
} from "./Constants";
import { DropdownOption } from "./TableFilters";
import { RenderOptionWrapper } from "./TableStyledWrappers";

//TODO(abhinav): Fix this cross import between widgets
import DatePickerComponent from "widgets/DatePickerWidget2/component";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";

const StyledRemoveIcon = styled(
  ControlIcons.CLOSE_CIRCLE_CONTROL as AnyStyledComponent,
)`
  padding: 0;
  position: relative;
  cursor: pointer;
  &.hide-icon {
    display: none;
  }
`;

const LabelWrapper = styled.div`
  width: 95px;
  margin-left: 10px;
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
  width: ${(props) => props.width}px;
  margin-left: 10px;
`;

const StyledInputGroup = styled(InputGroup)`
  background: ${Colors.WHITE};
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 2px;
  color: ${Colors.OXFORD_BLUE};
  height: 32px;
  width: 150px;
  margin-left: 10px;
  input {
    box-shadow: none;
  }
`;

const DatePickerWrapper = styled.div`
  margin-left: 10px;
  width: 150px;
`;

const DropdownTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  background: ${Colors.WHITE};
  border: 1px solid #d3dee3;
  box-sizing: border-box;
  border-radius: 2px;
  font-size: 14px;
  padding: 5px 12px 7px;
  color: ${Colors.OXFORD_BLUE};
  cursor: pointer;
  &&& span {
    margin-right: 0;
  }
`;

const AutoToolTipComponentWrapper = styled(AutoToolTipComponent)`
  width: 100%;
  color: ${Colors.OXFORD_BLUE};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 5px;
`;

const typeOperatorsMap: Record<ColumnTypes, DropdownOption[]> = {
  [ColumnTypes.TEXT]: [
    { label: "contains", value: "contains", type: "input" },
    { label: "does not contain", value: "doesNotContain", type: "input" },
    { label: "starts with", value: "startsWith", type: "input" },
    { label: "ends with", value: "endsWith", type: "input" },
    { label: "is exactly", value: "isExactly", type: "input" },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  [ColumnTypes.URL]: [
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
  [ColumnTypes.NUMBER]: [
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

const operatorOptions: DropdownOption[] = [
  { label: "OR", value: OperatorTypes.OR, type: "" },
  { label: "AND", value: OperatorTypes.AND, type: "" },
];

const columnTypeNameMap: Record<ColumnTypes, string> = {
  [ColumnTypes.TEXT]: "Text",
  [ColumnTypes.VIDEO]: "Video",
  [ColumnTypes.IMAGE]: "Image",
  [ColumnTypes.NUMBER]: "Num",
  [ColumnTypes.DATE]: "Date",
  [ColumnTypes.URL]: "Url",
};

function RenderOption(props: { type: string; title: string; active: boolean }) {
  return (
    <RenderOptionWrapper selected={props.active}>
      <div className="title">{props.title}</div>
      <div className="type">{columnTypeNameMap[props.type as ColumnTypes]}</div>
    </RenderOptionWrapper>
  );
}

function RenderOptions(props: {
  columns: DropdownOption[];
  selectItem: (column: DropdownOption) => void;
  placeholder: string;
  value?: string | Condition;
  showType?: boolean;
  className?: string;
}) {
  const [selectedValue, selectValue] = useState(props.placeholder);
  const configs = {
    sections: [
      {
        options: props.columns.map((column: DropdownOption) => {
          const isActive = column.value === props.value;
          return {
            content: props.showType ? (
              <RenderOption
                active={isActive}
                title={column.label}
                type={column.type}
              />
            ) : (
              column.label
            ),
            value: column.value,
            active: isActive,
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
        <DropdownTrigger className={props.className}>
          <AutoToolTipComponentWrapper title={selectedValue}>
            {selectedValue}
          </AutoToolTipComponentWrapper>
          <Icon color={Colors.SLATE_GRAY} icon="caret-down" iconSize={16} />
        </DropdownTrigger>
      ),
    },
    skin: Skin.LIGHT,
  };
  useEffect(() => {
    if (props.value && props.columns) {
      const selectedOptions = props.columns.filter(
        (i) => i.value === props.value,
      );
      if (selectedOptions && selectedOptions.length) {
        selectValue(selectedOptions[0].label);
      } else {
        selectValue(props.placeholder);
      }
    } else {
      selectValue(props.placeholder);
    }
  }, [props.value, props.placeholder, props.columns]);
  return <CustomizedDropdown {...configs} />;
}

function RenderInput(props: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const debouncedOnChange = useCallback(debounce(props.onChange, 400), []);
  const [value, setValue] = useState(props.value);
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(value);
    debouncedOnChange(value);
  };
  useEffect(() => {
    setValue(props.value);
  }, [props.value]);
  return (
    <StyledInputGroup
      className={props.className}
      defaultValue={value}
      onChange={onChange}
      placeholder="Enter value"
      type="text"
    />
  );
}

type CascadeFieldProps = {
  columns: DropdownOption[];
  column: string;
  condition: Condition;
  value: any;
  operator: Operator;
  index: number;
  hasAnyFilters: boolean;
  applyFilter: (filter: ReactTableFilter, index: number) => void;
  removeFilter: (index: number) => void;
};

type CascadeFieldState = {
  column: string;
  condition: Condition;
  value: any;
  operator: Operator;
  conditions: DropdownOption[];
  showConditions: boolean;
  showInput: boolean;
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
    const type: ColumnTypes = filteredColumn[0].type as ColumnTypes;
    return typeOperatorsMap[type];
  } else {
    return new Array<DropdownOption>(0);
  }
};

const showConditionsField = (props: CascadeFieldProps) => {
  const columnValue = props.column || "";
  const filteredColumn = props.columns.filter((column: DropdownOption) => {
    return columnValue === column.value;
  });
  return !!filteredColumn.length;
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
  const filteredConditions =
    conditions &&
    conditions.filter((condition: DropdownOption) => {
      return condition.value === conditionValue;
    });
  return !!filteredConditions.length && filteredConditions[0].type === "date";
};

function calculateInitialState(props: CascadeFieldProps) {
  const showConditions = showConditionsField(props);
  const conditions = getConditions(props);
  const showInput = showInputField(props, conditions);
  const showDateInput = showDateInputField(props, conditions);
  return {
    operator: props.operator,
    column: props.column,
    condition: props.condition,
    value: props.value,
    conditions: conditions,
    showConditions: showConditions,
    showInput: showInput,
    showDateInput: showDateInput,
    isDeleted: false,
    isUpdate: false,
  };
}

export enum CascadeFieldActionTypes {
  SELECT_COLUMN = "SELECT_COLUMN",
  SELECT_CONDITION = "SELECT_CONDITION",
  CHANGE_VALUE = "CHANGE_VALUE",
  SELECT_OPERATOR = "SELECT_OPERATOR",
  UPDATE_FILTER = "UPDATE_FILTER",
  DELETE_FILTER = "DELETE_FILTER",
}

type CascadeFieldAction = keyof typeof CascadeFieldActionTypes;

function CaseCaseFieldReducer(
  state: CascadeFieldState,
  action: {
    type: CascadeFieldAction;
    payload?: any;
  },
) {
  switch (action.type) {
    case CascadeFieldActionTypes.SELECT_COLUMN:
      const type: ColumnTypes = action.payload.type;
      return {
        ...state,
        column: action.payload.value,
        condition: "",
        conditions: typeOperatorsMap[type],
        showConditions: true,
        isUpdate: true,
      };
    case CascadeFieldActionTypes.SELECT_CONDITION:
      return {
        ...state,
        condition: action.payload.value,
        showInput: action.payload.type === "input",
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

function CascadeField(props: CascadeFieldProps) {
  const memoizedState = React.useMemo(() => calculateInitialState(props), [
    props,
  ]);
  return <Fields state={memoizedState} {...props} />;
}

function Fields(props: CascadeFieldProps & { state: CascadeFieldState }) {
  const { applyFilter, hasAnyFilters, index, removeFilter } = props;
  const [state, dispatch] = React.useReducer(CaseCaseFieldReducer, props.state);
  const handleRemoveFilter = () => {
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
  const onValueChange = (value: string) => {
    dispatch({
      type: CascadeFieldActionTypes.CHANGE_VALUE,
      payload: value,
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
      payload: OperatorTypes[option.value as Operator],
    });
  };

  const {
    column,
    condition,
    conditions,
    isDeleted,
    isUpdate,
    operator,
    showConditions,
    showDateInput,
    showInput,
    value,
  } = state;
  useEffect(() => {
    if (!isDeleted && isUpdate) {
      applyFilter({ operator, column, condition, value }, index);
    } else if (isDeleted) {
      removeFilter(index);
    }
  }, [
    operator,
    column,
    condition,
    value,
    isDeleted,
    isUpdate,
    index,
    applyFilter,
    removeFilter,
  ]);

  useEffect(() => {
    dispatch({
      type: CascadeFieldActionTypes.UPDATE_FILTER,
      payload: props,
    });
  }, [props]);
  return (
    <FieldWrapper className="t--table-filter">
      <StyledRemoveIcon
        className={`t--table-filter-remove-btn ${
          hasAnyFilters ? "" : "hide-icon"
        }`}
        color={Colors.GRAY}
        height={16}
        onClick={handleRemoveFilter}
        width={16}
      />
      {index === 1 ? (
        <DropdownWrapper width={95}>
          <RenderOptions
            className="t--table-filter-operators-dropdown"
            columns={operatorOptions}
            placeholder="or"
            selectItem={selectOperator}
            value={operator}
          />
        </DropdownWrapper>
      ) : (
        <LabelWrapper>
          {index === 0 ? "Where" : OperatorTypes[props.operator]}
        </LabelWrapper>
      )}
      <DropdownWrapper width={150}>
        <RenderOptions
          className="t--table-filter-columns-dropdown"
          columns={props.columns}
          placeholder="Attribute"
          selectItem={selectColumn}
          showType
          value={column}
        />
      </DropdownWrapper>
      {showConditions ? (
        <DropdownWrapper width={200}>
          <RenderOptions
            className="t--table-filter-conditions-dropdown"
            columns={conditions}
            placeholder=""
            selectItem={selectCondition}
            value={condition}
          />
        </DropdownWrapper>
      ) : null}
      {showInput ? (
        <RenderInput
          className="t--table-filter-value-input"
          onChange={onValueChange}
          value={value}
        />
      ) : null}
      {showDateInput ? (
        <DatePickerWrapper className="t--table-filter-date-input">
          <DatePickerComponent
            closeOnSelection
            dateFormat="YYYY-MM-DD HH:mm"
            datePickerType="DATE_PICKER"
            isDisabled={false}
            isLoading={false}
            label=""
            onDateSelected={onDateSelected}
            selectedDate={value}
            shortcuts={false}
            timePrecision={TimePrecision.MINUTE}
            widgetId=""
            withoutPortal
          />
        </DatePickerWrapper>
      ) : null}
    </FieldWrapper>
  );
}

export default CascadeField;
