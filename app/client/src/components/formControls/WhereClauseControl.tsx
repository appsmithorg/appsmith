import React, { useEffect, useRef } from "react";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import { FieldArray, getFormValues } from "redux-form";
import type { ControlProps } from "./BaseControl";
import _ from "lodash";
import { useSelector } from "react-redux";
import { getBindingOrConfigPathsForWhereClauseControl } from "entities/Action/actionProperties";
import { WhereClauseSubComponent } from "./utils";
import useResponsiveBreakpoints from "utils/hooks/useResponsiveBreakpoints";
import { Button, Tooltip } from "@appsmith/ads";

//Dropdwidth and Icon have fixed widths
const DropdownWidth = 82; //pixel value
const OperatorDropdownWidth = 100; // operators should have longer dropdown widths.
const Margin = 8;

// Type of the value for each condition
export interface whereClauseValueType {
  condition?: string;
  children?: [whereClauseValueType];
  key?: string;
  value?: string;
}

// Form config for the value field
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const valueFieldConfig: any = {
  key: "value",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "Value",
};

// Form config for the key field
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const keyFieldConfig: any = {
  key: "key",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "Column name",
};

// Form config for the condition field
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conditionFieldConfig: any = {
  key: "operator",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
  options: [],
};

// Form config for the operator field
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logicalFieldConfig: any = {
  key: "condition",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LogicalFieldValue: any = styled.p<{
  width: string | undefined;
  size: string;
}>`
  ${(props) => (props.width ? "width: " + props.width + ";" : "")}
  text-align: right;
  color: var(--ads-v2-color-fg-muted);
  flex-shrink: 0;

  ${(props) =>
    props.size === "small" &&
    `
    margin: 4px 0 0;
    text-align: left;
  `}
`;

// Component for the delete Icon
const CenteredIconButton = styled(Button)<{
  alignSelf?: string;
  top?: string;
}>`
  position: relative;
  align-self: ${(props) => (props.alignSelf ? props.alignSelf : "center")};
  top: ${(props) => (props.top ? props.top : "0px")};
`;

// We are setting a background color for the last two nested levels
const handleSecondaryBoxBackgroundColor = (
  currentNestingLevel: number,
  nestedLevels: number,
) => {
  if (currentNestingLevel === nestedLevels) {
    return `background-color: var(--ads-v2-color-bg-muted);`;
  } else if (currentNestingLevel === nestedLevels - 1) {
    return `background-color: var(--ads-v2-color-bg-subtle);`;
  } else {
    return "";
  }
};

// Wrapper inside the main box, contains the dropdown and ConditionWrapper
const SecondaryBox = styled.div<{
  currentNestingLevel: number;
  nestedLevels: number;
  showBorder: boolean;
  size: string;
}>`
  display: flex;
  flex-direction: column;
  position: relative;
  border: solid 1px var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  border-width: ${(props) => (props?.showBorder ? "1px" : "0px")};
  padding: ${(props) =>
    props?.showBorder ? "0px 12px 12px 8px" : "4px 0px 12px 0px"};

  width: 100%;
  // Setting a max width to not have it really elongate on very large screens
  max-width: 2000px;

  ${(props) =>
    props.size === "small" &&
    `
    ${handleSecondaryBoxBackgroundColor(
      props.currentNestingLevel,
      props.nestedLevels,
    )}
  `}
`;

// Wrapper to contain either a ConditionComponent or ConditionBlock
const ConditionWrapper = styled.div<{ size: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  gap: var(--ads-v2-spaces-4);
  margin-top: var(--ads-v2-spaces-3);
  margin-bottom: 5px;

  ${(props) =>
    props.size === "small" &&
    `
    gap: 0px;
    flex-direction: column;
    align-items: start;
  `}
  .ads-v2-select>.rc-select-selector {
    min-width: 80px;
    background-color: var(--ads-v2-color-bg);
  }
`;

// Wrapper to contain a single condition statement
const ConditionBox = styled.div<{ size?: string }>`
  display: grid;
  // The 4 elements(3 input fields and a close button) are horizontally aligned
  // by default
  grid-template-columns: auto 100px auto max-content;
  column-gap: var(--ads-v2-spaces-4);
  row-gap: var(--ads-v2-spaces-2);
  width: 100%;

  ${(props) =>
    props.size === "small" &&
    `
    // Smallest width of the component such that the text CTA's "ADD GROUP CONDITION"
    // fits in the available space without overflow
    min-width: 325px;
    margin: 5px 0px;
    // In small space we shift to a two column layout where the three inputs
    // are verticall aligned one below the other.
    grid-template-columns: repeat(2, max-content);
    grid-template-rows: repeat(3, max-content);
    column-gap: var(--ads-v2-spaces-4);
    // The three input fields will be in the first column
    & :not(:nth-child(4)) {
      grid-column-start: 1;
    }
    // The fourth element i.e the close button will be placed in the second row
    // to have it center aligned
    & :nth-child(4) {
      grid-column-start: 2;
      grid-row-start: 2;
    }
  `}
`;

// Box containing the action buttons to add more filters
const ActionBox = styled.div<{ marginLeft: string; size: string }>`
  display: flex;
  flex-direction: row;
  row-gap: var(--ads-v2-spaces-2);
  background-color: inherit;
  margin-left: ${(props) => props.marginLeft};

  ${(props) =>
    props.size === "small" &&
    `
    margin-left: 0;
  `}
`;

const GroupConditionBox = styled.div<{ size: string }>`
  display: flex;
  flex-direction: row;
  gap: var(--ads-v2-spaces-4);
  width: 100%;

  ${(props) =>
    props.size === "small" &&
    `
    margin: 5px 0px;
    flex-direction: row;
    min-width: max-content;
  `}
`;

// Component to display single line of condition, includes 2 inputs and 1 dropdown
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ConditionComponent(props: any, index: number) {
  // Custom styles have to be passed as props, otherwise the UI will be disproportional

  const keyPath = getBindingOrConfigPathsForWhereClauseControl(
    props.field,
    WhereClauseSubComponent.Key,
  );
  const valuePath = getBindingOrConfigPathsForWhereClauseControl(
    props.field,
    WhereClauseSubComponent.Value,
  );
  const conditionPath = getBindingOrConfigPathsForWhereClauseControl(
    props.field,
    WhereClauseSubComponent.Condition,
  );

  return (
    <ConditionBox key={index} size={props.size}>
      {/* Component to input the LHS for single condition */}
      <FormControl
        config={{
          ...keyFieldConfig,
          configProperty: keyPath,
          customStyles: {
            // Smallest width where the full placeholder fits
            minWidth: "100px",
          },
        }}
        formName={props.formName}
      />
      {/* Component to select the operator for the 2 inputs */}
      <FormControl
        config={{
          ...conditionFieldConfig,
          // Set default width when in small space
          customStyles:
            props.size === "small"
              ? {}
              : {
                  width: `${OperatorDropdownWidth}px`,
                },
          configProperty: conditionPath,
          options: props.comparisonTypes,
          initialValue: props.comparisonTypes[0].value,
        }}
        formName={props.formName}
      />
      {/* Component to input the RHS for single component */}
      <FormControl
        config={{
          ...valueFieldConfig,
          configProperty: valuePath,
          customStyles: {
            minWidth: "100px",
          },
        }}
        formName={props.formName}
      />
      {/* Component to render the delete icon */}
      <CenteredIconButton
        data-testid={`t--where-clause-delete-[${index}]`}
        isIconButton
        kind="tertiary"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          props.onDeletePressed(index);
        }}
        size="md"
        startIcon="close"
      />
    </ConditionBox>
  );
}

// This is the block which contains an operator and multiple conditions/ condition blocks
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ConditionBlock(props: any) {
  const targetRef = useRef<HTMLDivElement>(null);
  // Smallest width of the component below which the individual input fields don't
  // decrease in width anymore so we decide to shift to small space layout at this point
  const size = useResponsiveBreakpoints(targetRef, [{ small: 505 }]);

  const formValues = useSelector((state) =>
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

  let isDisabled = false;

  if (props.logicalTypes.length === 1) {
    isDisabled = true;
  }

  const logicalFieldPath = getBindingOrConfigPathsForWhereClauseControl(
    props.configProperty,
    WhereClauseSubComponent.Condition,
  );
  const logicalFieldValue = _.get(formValues, logicalFieldPath);

  return (
    <SecondaryBox
      className={`t--${props?.configProperty}`}
      currentNestingLevel={props.currentNestingLevel}
      nestedLevels={props.nestedLevels}
      ref={targetRef}
      showBorder={props.currentNestingLevel >= 1}
      size={size}
    >
      {props.fields &&
        props.fields.length > 0 &&
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props.fields.map((field: any, index: number) => {
          const fieldValue: whereClauseValueType = props.fields.get(index);

          return (
            <ConditionWrapper key={`where-${index}`} size={size}>
              {/* Component to render the joining operator between multiple conditions */}
              {index == 0 ? (
                <LogicalFieldValue size={size} width={`${DropdownWidth}px`}>
                  Where
                </LogicalFieldValue>
              ) : index == 1 ? (
                <FormControl
                  config={{
                    ...logicalFieldConfig,
                    customStyles: {
                      width: `${DropdownWidth}px`,
                    },
                    configProperty: logicalFieldPath,
                    options: props.logicalTypes,
                    initialValue: props.logicalTypes[0].value,
                    isDisabled,
                  }}
                  formName={props.formName}
                />
              ) : (
                <LogicalFieldValue size={size} width={`${DropdownWidth}px`}>
                  {logicalFieldValue}
                </LogicalFieldValue>
              )}
              {!!fieldValue && "children" in fieldValue ? (
                <GroupConditionBox size={size}>
                  <FieldArray
                    component={ConditionBlock}
                    key={`${field}.children`}
                    name={`${field}.children`}
                    props={{
                      maxWidth: props.maxWidth,
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
                  <CenteredIconButton
                    alignSelf={"start"}
                    data-testid={`t--where-clause-delete-[${index}]`}
                    isIconButton
                    kind="tertiary"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDeletePressed(index);
                    }}
                    size="md"
                    startIcon="close"
                    top={"24px"}
                  />
                </GroupConditionBox>
              ) : (
                ConditionComponent(
                  {
                    onDeletePressed,
                    field,
                    formName: props.formName,
                    comparisonTypes: props.comparisonTypes,
                    maxWidth: props.maxWidth,
                    currentNestingLevel: props.currentNestingLevel,
                    size,
                  },
                  index,
                )
              )}
            </ConditionWrapper>
          );
        })}
      <ActionBox marginLeft={`${DropdownWidth + Margin}px`} size={size}>
        <Button
          className={`t--where-add-condition[${props?.currentNestingLevel}]`}
          kind="tertiary"
          onClick={
            () =>
              props.fields.push({
                key: "",
                condition: props.comparisonTypes[0].value,
                value: "",
              })
            // Add empty and key and value as it will be required to create binding paths in getBindingPathsOfAction() at ActionProperties.ts
          }
          size="md"
          startIcon="add-more"
        >
          Add condition
        </Button>
        {/* Check if the config allows more nesting, if it does, allow for adding more blocks */}
        <Tooltip
          content={
            <span>
              For S3 only 4 nested where <br /> condition group is allowed.
            </span>
          }
          isDisabled={props.currentNestingLevel < props.nestedLevels}
          placement="bottom"
        >
          <Button
            className={`t--where-add-group-condition[${props?.currentNestingLevel}]`}
            isDisabled={!(props.currentNestingLevel < props.nestedLevels)}
            kind="tertiary"
            onClick={() => {
              if (props.currentNestingLevel < props.nestedLevels) {
                props.fields.push({
                  condition: props.logicalTypes[0].value,
                  children: [
                    {
                      condition: props.comparisonTypes[0].value,
                    },
                  ],
                });
              }
            }}
            size="md"
            startIcon="add-more"
          >
            Add group condition
          </Button>
        </Tooltip>
      </ActionBox>
    </SecondaryBox>
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
  const maxWidth = 60; //in vw

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
