import React, { useEffect } from "react";
import FormControl from "pages/Editor/FormControl";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import styled from "styled-components";
import { FieldArray, getFormValues } from "redux-form";
import { ControlProps } from "./BaseControl";
import _ from "lodash";
import { useSelector } from "react-redux";

// Type of the value for each condition
export type whereClauseValueType = {
  condition?: string;
  children?: [whereClauseValueType];
  key?: string;
  value?: string;
};

// Form config for the value field
const valueFieldConfig: any = {
  key: "value",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "value",
};

// Form config for the key field
const keyFieldConfig: any = {
  key: "key",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "key",
};

// Form config for the condition field
const conditionFieldConfig: any = {
  key: "operator",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
  options: [],
};

// Form config for the operator field
const logicalFieldConfig: any = {
  label: "Condition",
  key: "condition",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
  options: [],
  customStyles: { width: "5vw" },
};

// Component for the delete Icon
const CenteredIcon = styled(Icon)<{
  alignSelf?: string;
  marginBottom?: string;
}>`
  margin-left: 5px;
  align-self: ${(props) => (props.alignSelf ? props.alignSelf : "end")};
  margin-bottom: ${(props) =>
    props.marginBottom ? props.marginBottom : "10px"};
  &.hide {
    opacity: 0;
    pointer-events: none;
  }
`;

// Outer box that houses the whole component
const PrimaryBox = styled.div`
  display: flex;
  width: min-content;
  flex-direction: column;
  border: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  padding: 10px;
`;

// Wrapper inside the main box, contains the dropdown and ConditionWrapper
const SecondaryBox = styled.div`
  display: flex;
  flex-direction: row;
`;

// Wrapper to contain either a ConditionComponent or ConditionBlock
const ConditionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: min-content;
  justify-content: space-between;
`;

// Wrapper to contain a single condition statement
const ConditionBox = styled.div`
  display: flex;
  flex-direction: row;
  width: min-content;
  justify-content: space-between;
`;

// Box containing the action buttons to add more filters
const ActionBox = styled.div`
  display: flex;
  margin-top: 16px;
  flex-direction: row;
  width: max-content;
  justify-content: space-between;
`;

// The final button to add more filters/ filter groups
const AddMoreAction = styled.div`
  cursor: pointer;
  .${Classes.TEXT} {
    margin-left: 8px;
    color: #03b365;
  }
`;

// Component to display single line of condition, includes 2 inputs and 1 dropdown
function ConditionComponent(props: any, index: number) {
  // Custom styles have to be passed as props, otherwise the UI will be disproportional

  // 5 is subtracted because the width of the operator dropdown is 5vw
  const unitWidth = (props.maxWidth - 5) / 5;

  // Labels are only displayed if the condition is the first one
  let keyLabel = "";
  let valueLabel = "";
  let conditionLabel = "";
  if (index === 0) {
    keyLabel = "Key";
    valueLabel = "Value";
    conditionLabel = "Operator";
  }
  return (
    <ConditionBox key={index}>
      {/* Component to input the LHS for single condition */}
      <FormControl
        config={{
          ...keyFieldConfig,
          label: keyLabel,
          customStyles: { width: `${unitWidth * 2}vw` },
          configProperty: `${props.field}.key`,
        }}
        formName={props.formName}
      />
      {/* Component to select the operator for the 2 inputs */}
      <FormControl
        config={{
          ...conditionFieldConfig,
          label: conditionLabel,
          customStyles: { width: `${unitWidth * 1}vw` },
          configProperty: `${props.field}.condition`,
          options: props.comparisonTypes,
          initialValue: props.comparisonTypes[0].value,
        }}
        formName={props.formName}
      />
      {/* Component to input the RHS for single component */}
      <FormControl
        config={{
          ...valueFieldConfig,
          label: valueLabel,
          customStyles: { width: `${unitWidth * 2}vw` },
          configProperty: `${props.field}.value`,
        }}
        formName={props.formName}
      />
      {/* Component to render the delete icon */}
      <CenteredIcon
        name="trash"
        onClick={(e) => {
          e.stopPropagation();
          props.onDeletePressed(index);
        }}
        size={IconSize.XL}
      />
    </ConditionBox>
  );
}

// This is the block which contains an operator and multiple conditions/ condition blocks
function ConditionBlock(props: any) {
  const formValues: any = useSelector((state) =>
    getFormValues(props.formName)(state),
  );

  const onDeletePressed = (index: number) => {
    props.fields.remove(index);
  };

  // sometimes, this condition runs before the appropriate formValues has been initialized with the correct query values.
  useEffect(() => {
    // so make sure the new formValue has been initialized with the where object,
    // especially when switching between various queries across the same Query editor form.
    const whereConfigValue = _.get(formValues, props.configProperty);
    // if the where object exists then it means the initialization of the form has been completed.
    // if the where object exists and the length of children field is less than one, add a new field.
    if (props.fields.length < 1 && !!whereConfigValue) {
      if (props.currentNestingLevel === 0) {
        props.fields.push({
          condition: props.comparisonTypes[0].value,
        });
      } else {
        props.onDeletePressed(props.index);
      }
    }
  }, [props.fields.length]);

  let marginTop = "8px";
  // In case the first component is a complex element, add extra margin
  // because the keys are not visible. Will not affect the outer most
  // component because index is not present in the props
  if (props.index === 0) {
    marginTop = "24px";
  }

  let isDisabled = false;
  if (props.logicalTypes.length === 1) {
    isDisabled = true;
  }
  return (
    <PrimaryBox style={{ marginTop }}>
      <SecondaryBox>
        {/* Component to render the joining operator between multiple conditions */}
        <FormControl
          config={{
            ...logicalFieldConfig,
            configProperty: `${props.configProperty}.condition`,
            options: props.logicalTypes,
            initialValue: props.logicalTypes[0].value,
            isDisabled,
          }}
          formName={props.formName}
        />
        <ConditionWrapper>
          {props.fields &&
            props.fields.length > 0 &&
            props.fields.map((field: any, index: number) => {
              const fieldValue: whereClauseValueType = props.fields.get(index);
              if (!!fieldValue && "children" in fieldValue) {
                // If the value contains children in it, that means it is a ConditionBlock
                const maxWidth = props.maxWidth - 7.5;
                return (
                  <ConditionBox>
                    <FieldArray
                      component={ConditionBlock}
                      key={`${field}.children`}
                      name={`${field}.children`}
                      props={{
                        maxWidth,
                        configProperty: `${field}`,
                        formName: props.formName,
                        logicalTypes: props.logicalTypes,
                        comparisonTypes: props.comparisonTypes,
                        nestedLevels: props.nestedLevels,
                        currentNestingLevel: props.currentNestingLevel + 1,
                        onDeletePressed,
                        index,
                      }}
                      rerenderOnEveryChange={false}
                    />
                    <CenteredIcon
                      alignSelf={"center"}
                      marginBottom={"-5px"}
                      name="trash"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePressed(index);
                      }}
                      size={IconSize.XL}
                    />
                  </ConditionBox>
                );
              } else {
                // Render a single condition component
                return ConditionComponent(
                  {
                    onDeletePressed,
                    field,
                    formName: props.formName,
                    comparisonTypes: props.comparisonTypes,
                    maxWidth: props.maxWidth,
                  },
                  index,
                );
              }
            })}
        </ConditionWrapper>
      </SecondaryBox>
      <ActionBox>
        <AddMoreAction
          onClick={() =>
            props.fields.push({ condition: props.comparisonTypes[0].value })
          }
        >
          {/*Hardcoded label to be removed */}
          <Text type={TextType.H5}>+ Add Filter</Text>
        </AddMoreAction>
        {/* Check if the config allows more nesting, if it does, allow for adding more blocks */}
        {props.currentNestingLevel < props.nestedLevels && (
          <AddMoreAction
            onClick={() => {
              props.fields.push({
                condition: props.logicalTypes[0].value,
                children: [
                  {
                    condition: props.comparisonTypes[0].value,
                  },
                ],
              });
            }}
          >
            {/*Hardcoded label to be removed */}
            <Text type={TextType.H5}>+ Add Filter Group</Text>
          </AddMoreAction>
        )}
      </ActionBox>
    </PrimaryBox>
  );
}

export default function WhereClauseControl(props: WhereClauseControlProps) {
  const {
    comparisonTypes, // All possible keys for the comparison
    configProperty, // JSON path for the where clause data
    formName, // Name of the form, used by redux-form lib to store the data in redux store
    logicalTypes, // All possible keys for the logical operators joining multiple conditions
    nestedLevels, // Number of nested levels allowed
  } = props;

  // Max width is designed in a way that the proportion stays same even after nesting
  const maxWidth = 55;
  return (
    <FieldArray
      component={ConditionBlock}
      key={`${configProperty}.children`}
      name={`${configProperty}.children`}
      props={{
        configProperty,
        maxWidth,
        formName,
        logicalTypes,
        comparisonTypes,
        nestedLevels,
        currentNestingLevel: 0,
      }}
      rerenderOnEveryChange={false}
    />
  );
}

export type WhereClauseControlProps = ControlProps;
