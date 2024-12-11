import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { InputGroup } from "@blueprintjs/core";
import { debounce, isNaN } from "lodash";

import CustomizedDropdown from "pages/common/CustomizedDropdown";
import { Directions } from "utils/helpers";
import { Colors } from "constants/Colors";
import { Skin } from "constants/DefaultTheme";
import AutoToolTipComponent from "../../../cellComponents/AutoToolTipComponent";
import type { Condition, Operator, ReactTableFilter } from "../../../Constants";
import { OperatorTypes } from "../../../Constants";
import type { DropdownOption } from "./index";
import { RenderOptionWrapper } from "../../../TableStyledWrappers";

//TODO(abhinav): Fix this cross import between widgets
import DatePickerComponent from "widgets/DatePickerWidget2/component";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";
import { ColumnTypes, ReadOnlyColumnTypes } from "../../../../constants";
import { importRemixIcon } from "@appsmith/ads-old";

const CloseIcon = importRemixIcon(
  async () => import("remixicon-react/CloseCircleFillIcon"),
);
const ArrowDownIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowDownSLineIcon"),
);

const LabelWrapper = styled.div`
  width: 95px;
  margin-left: 10px;
  color: var(--wds-color-text-light);
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

const StyledInputGroup = styled(InputGroup)<{
  borderRadius?: string;
}>`
  background: var(--wds-color-bg);
  border: 1px solid var(--wds-color-border);
  box-sizing: border-box;
  border-radius: ${(props) => props.borderRadius || "0"};
  color: var(--wds-color-text);
  height: 32px;
  width: 120px;
  margin-left: 10px;
  overflow: hidden;

  input {
    box-shadow: none;
  }

  input:focus {
    box-shadow: none;
  }
  &:hover {
    border-color: var(--wds-color-border-hover);
  }
`;

const DatePickerWrapper = styled.div`
  margin-left: 10px;
  width: 150px;
`;

const DropdownTrigger = styled.div<{
  borderRadius?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  background: var(--wds-color-bg);
  border: 1px solid var(--wds-color-border);
  box-sizing: border-box;
  border-radius: ${(props) => props.borderRadius || "0"};
  font-size: 14px;
  padding: 5px 12px 7px;
  color: var(--wds-color-text);
  cursor: pointer;

  &:hover {
    border-color: var(--wds-color-border-hover);
  }
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

const typeOperatorsMap: Record<ReadOnlyColumnTypes, DropdownOption[]> = {
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
  [ColumnTypes.CHECKBOX]: [
    { label: "is checked", value: "isChecked", type: "" },
    { label: "is unchecked", value: "isUnChecked", type: "" },
  ],
  [ColumnTypes.SWITCH]: [
    { label: "is checked", value: "isChecked", type: "" },
    { label: "is unchecked", value: "isUnChecked", type: "" },
  ],
  [ColumnTypes.SELECT]: [
    { label: "contains", value: "contains", type: "input" },
    { label: "does not contain", value: "doesNotContain", type: "input" },
    { label: "starts with", value: "startsWith", type: "input" },
    { label: "ends with", value: "endsWith", type: "input" },
    { label: "is exactly", value: "isExactly", type: "input" },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
  [ColumnTypes.HTML]: [
    { label: "contains", value: "contains", type: "input" },
    { label: "does not contain", value: "doesNotContain", type: "input" },
    { label: "empty", value: "empty", type: "" },
    { label: "not empty", value: "notEmpty", type: "" },
  ],
};

const operatorOptions: DropdownOption[] = [
  { label: "OR", value: OperatorTypes.OR, type: "" },
  { label: "AND", value: OperatorTypes.AND, type: "" },
];

const columnTypeNameMap: Record<ReadOnlyColumnTypes, string> = {
  [ReadOnlyColumnTypes.TEXT]: "Text",
  [ReadOnlyColumnTypes.VIDEO]: "Video",
  [ReadOnlyColumnTypes.IMAGE]: "Image",
  [ReadOnlyColumnTypes.NUMBER]: "Num",
  [ReadOnlyColumnTypes.DATE]: "Date",
  [ReadOnlyColumnTypes.URL]: "Url",
  [ReadOnlyColumnTypes.CHECKBOX]: "Check",
  [ReadOnlyColumnTypes.SWITCH]: "Check",
  [ReadOnlyColumnTypes.SELECT]: "Text",
  [ReadOnlyColumnTypes.HTML]: "HTML",
};

function RenderOption(props: { type: string; title: string; active: boolean }) {
  return (
    <RenderOptionWrapper selected={props.active}>
      <div className="title">{props.title}</div>
      <div className="type">
        {columnTypeNameMap[props.type as ReadOnlyColumnTypes]}
      </div>
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
  borderRadius?: string;
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
        <DropdownTrigger
          borderRadius={props.borderRadius}
          className={props.className}
        >
          <AutoToolTipComponentWrapper disablePadding title={selectedValue}>
            {selectedValue}
          </AutoToolTipComponentWrapper>
          <ArrowDownIcon className="w-5 h-5" color="var(--wds-color-icon)" />
        </DropdownTrigger>
      ),
    },
    skin: Skin.LIGHT,
    borderRadius: props.borderRadius,
    customizedDropdownId: "cascade-dropdown",
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
  borderRadius?: string;
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
      borderRadius={props.borderRadius}
      className={props.className}
      defaultValue={value}
      onChange={onChange}
      placeholder="Enter value"
      type="text"
    />
  );
}

interface CascadeFieldProps {
  columns: DropdownOption[];
  column: string;
  condition: Condition;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  operator: Operator;
  id: string;
  index: number;
  hasAnyFilters: boolean;
  applyFilter: (
    filter: ReactTableFilter,
    index: number,
    isOperatorChange: boolean,
  ) => void;
  removeFilter: (index: number) => void;
  accentColor: string;
  borderRadius: string;
}

interface CascadeFieldState {
  column: string;
  condition: Condition;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  operator: Operator;
  conditions: DropdownOption[];
  showConditions: boolean;
  showInput: boolean;
  showDateInput: boolean;
  isDeleted: boolean;
  isUpdate: boolean;
  isOperatorChange: boolean;
}

const getConditions = (props: CascadeFieldProps) => {
  const columnValue = props.column || "";
  const filteredColumn = props.columns.filter((column: DropdownOption) => {
    return columnValue === column.value;
  });

  if (filteredColumn.length) {
    const type: ReadOnlyColumnTypes = filteredColumn[0]
      .type as ReadOnlyColumnTypes;

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
    isOperatorChange: false,
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
  },
) {
  switch (action.type) {
    case CascadeFieldActionTypes.SELECT_COLUMN:
      const type: ReadOnlyColumnTypes = action.payload.type;

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
        isOperatorChange: true,
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
  const memoizedState = React.useMemo(
    () => calculateInitialState(props),
    [props],
  );

  return <Fields state={memoizedState} {...props} />;
}

function Fields(props: CascadeFieldProps & { state: CascadeFieldState }) {
  const { applyFilter, hasAnyFilters, id, index, removeFilter } = props;
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
    const parsedValue = value && !isNaN(Number(value)) ? Number(value) : value;

    dispatch({
      type: CascadeFieldActionTypes.CHANGE_VALUE,
      payload: parsedValue,
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
    isOperatorChange,
    isUpdate,
    operator,
    showConditions,
    showDateInput,
    showInput,
    value,
  } = state;

  useEffect(() => {
    if (!isDeleted && isUpdate) {
      applyFilter(
        { id, operator, column, condition, value },
        index,
        isOperatorChange,
      );
    } else if (isDeleted) {
      removeFilter(index);
    }
  }, [
    operator,
    column,
    condition,
    value,
    isDeleted,
    isOperatorChange,
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
      <CloseIcon
        className={`t--table-filter-remove-btn w-6 h-6 cursor-pointer ${
          hasAnyFilters ? "" : "hidden"
        }`}
        color="var(--wds-color-icon)"
        onClick={handleRemoveFilter}
      />
      {index === 1 ? (
        <DropdownWrapper width={95}>
          <RenderOptions
            borderRadius={props.borderRadius}
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
      <DropdownWrapper width={120}>
        <RenderOptions
          borderRadius={props.borderRadius}
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
            borderRadius={props.borderRadius}
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
          borderRadius={props.borderRadius}
          className="t--table-filter-value-input"
          onChange={onValueChange}
          value={value}
        />
      ) : null}
      {showDateInput ? (
        <DatePickerWrapper className="t--table-filter-date-input">
          <DatePickerComponent
            accentColor={props.accentColor}
            backgroundColor="#fff"
            borderRadius={props.borderRadius}
            closeOnSelection
            compactMode
            dateFormat="YYYY-MM-DD HH:mm"
            datePickerType="DATE_PICKER"
            isDisabled={false}
            isLoading={false}
            labelText=""
            onDateSelected={onDateSelected}
            selectedDate={value}
            shortcuts={false}
            timePrecision={TimePrecision.MINUTE}
            widgetId=""
          />
        </DatePickerWrapper>
      ) : null}
    </FieldWrapper>
  );
}

export default CascadeField;
