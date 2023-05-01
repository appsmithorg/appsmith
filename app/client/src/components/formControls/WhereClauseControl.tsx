import React, { useEffect, useRef } from "react";
import FormControl from "pages/Editor/FormControl";
import { Icon, IconSize } from "design-system-old";
import styled from "styled-components";
import { FieldArray, getFormValues } from "redux-form";
import type { ControlProps } from "./BaseControl";
import _ from "lodash";
import { useSelector } from "react-redux";
import { getBindingOrConfigPathsForWhereClauseControl } from "entities/Action/actionProperties";
import { WhereClauseSubComponent } from "./utils";
import { TooltipComponent as Tooltip } from "design-system-old";
import useResponsiveBreakpoints from "utils/hooks/useResponsiveBreakpoints";
import { Colors } from "constants/Colors";

//Dropdwidth and Icon have fixed widths
const DropdownWidth = 82; //pixel value
const OperatorDropdownWidth = 100; // operators should have longer dropdown widths.
const Margin = 8;

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
  placeholderText: "Value",
};

// Form config for the key field
const keyFieldConfig: any = {
  key: "key",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "Column name",
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
  key: "condition",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
};

const LogicalFieldValue: any = styled.p<{
  width: string | undefined;
  size: string;
}>`
  ${(props) => (props.width ? "width: " + props.width + ";" : "")}
  margin: 4px 0px;
  border: solid 1.2px transparent;
  text-align: right;
  color: var(--appsmith-color-black-400);
  font-size: 14px;
  flex-shrink: 0;

  ${(props) =>
    props.size === "small" &&
    `
    margin: 4px 0 0;
    text-align: left;
  `}
`;

// Component for the delete Icon
const CenteredIcon = styled(Icon)<{
  alignSelf?: string;
  top?: string;
}>`
  position: relative;
  align-self: ${(props) => (props.alignSelf ? props.alignSelf : "center")};
  top: ${(props) => (props.top ? props.top : "0px")};
  &.hide {
    opacity: 0;
    pointer-events: none;
  }
`;

// We are setting a background color for the last two nested levels
const handleSecondaryBoxBackgroudColor = (
  currentNestingLevel: number,
  nestedLevels: number,
) => {
  if (currentNestingLevel === nestedLevels) {
    return `background-color: ${Colors.GRAY_100};`;
  } else if (currentNestingLevel === nestedLevels - 1) {
    return `background-color: ${Colors.GRAY_50};`;
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
  border: solid 1.2px #e0dede;
  border-width: ${(props) => (props?.showBorder ? "1.2px" : "0px")};
  padding: ${(props) =>
    props?.showBorder ? "0px 12px 28px 8px" : "4px 12px 24px 0px"};
  width: 100%;
  // Setting a max width to not have it really elongate on very large screens
  max-width: 2000px;

  ${(props) =>
    props.size === "small" &&
    `
    ${handleSecondaryBoxBackgroudColor(
      props.currentNestingLevel,
      props.nestedLevels,
    )}
    padding-bottom: 20px;
  `}
`;

// Wrapper to contain either a ConditionComponent or ConditionBlock
const ConditionWrapper = styled.div<{ size: string }>`
  display: flex;
  flex-direction: row;
  align-items: start;
  width: 100%;
  gap: 8px;
  margin-top: 12px;

  ${(props) =>
    props.size === "small" &&
    `
    margin-top: 0px;
    gap: 0px;
    flex-direction: column;
    align-items: start;
  `}
`;

// Wrapper to contain a single condition statement
const ConditionBox = styled.div<{ size?: string }>`
  display: grid;
  // The 4 elements(3 input fields and a close button) are horizontally aligned
  // by default
  grid-template-columns: auto 100px auto max-content;
  grid-column-gap: 12px;
  grid-row-gap: 8px;
  width: 100%;

  ${(props) =>
    props.size === "small" &&
    `
    // Smallest width of the component such that the text CTA's "ADD GROUP CONDITION"
    // fits in the available space without overflow
    min-width: 325px;
    margin: 8px 0px;
    // In small space we shift to a two column layout where the three inputs
    // are verticall aligned one below the other.
    grid-template-columns: repeat(2, max-content);
    grid-template-rows: repeat(3, max-content);
    grid-column-gap: 8px;
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
  margin-top: 16px;
  flex-direction: row;
  gap: 20px;
  width: max-content;
  justify-content: space-between;
  position: absolute;
  height: 24px;
  text-transform: uppercase;
  background-color: inherit;
  bottom: 0px;
  margin-left: ${(props) => props.marginLeft};

  ${(props) =>
    props.size === "small" &&
    `
    margin-left: 0;
  `}
`;

// The final button to add more filters/ filter groups
const AddMoreAction = styled.div<{ isDisabled?: boolean; size?: string }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 14px;
  letter-spacing: 0.6px;
  color: ${(props) =>
    props.isDisabled ? "var(--appsmith-color-black-300)" : "#858282;"};

  // Hide the "ADD GROUP CONDITION" text when in small space and is disabled
  ${(props) =>
    props.size === "small" &&
    props.isDisabled &&
    `
    display: none;
  `}
`;

const GroupConditionBox = styled.div<{ size: string }>`
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;

  ${(props) =>
    props.size === "small" &&
    `
  gap: 8px;
  margin: 8px 0px;
  flex-direction: row;
  min-width: max-content;
  `}
`;

const StyledTooltip = styled(Tooltip)`
  display: flex;
  align-items: center;
  .bp3-tooltip.ads-global-tooltip .bp3-popover-content {
    padding: 8px 12px;
    line-height: 16px;
    text-transform: none;
  }
  .bp3-tooltip.ads-global-tooltip .bp3-popover-arrow[style*="left"] {
    left: auto !important;
    right: 0px;
  }
`;
// Component to display single line of condition, includes 2 inputs and 1 dropdown
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
      <CenteredIcon
        cypressSelector={`t--where-clause-delete-[${index}]`}
        name="cross"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          props.onDeletePressed(index);
        }}
        size={IconSize.SMALL}
        top="-1px"
      />
    </ConditionBox>
  );
}

// This is the block which contains an operator and multiple conditions/ condition blocks
function ConditionBlock(props: any) {
  const targetRef = useRef<HTMLDivElement>(null);
  // Smallest width of the component below which the individual input fields don't
  // decrease in width anymore so we decide to shift to small space layout at this point
  const size = useResponsiveBreakpoints(targetRef, [{ small: 505 }]);
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
                  <CenteredIcon
                    alignSelf={"start"}
                    cypressSelector={`t--where-clause-delete-[${index}]`}
                    name="cross"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDeletePressed(index);
                    }}
                    size={IconSize.SMALL}
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
        <AddMoreAction
          className={`t--where-add-condition[${props?.currentNestingLevel}]`}
          onClick={
            () =>
              props.fields.push({
                key: "",
                condition: props.comparisonTypes[0].value,
                value: "",
              })
            // Add empty and key and value as it will required to create binding paths in getBindingPathsOfAction() at ActionProperties.ts
          }
        >
          <Icon name="add-more-fill" size={IconSize.XL} />
          <span style={{ marginLeft: "8px" }}>Add Condition</span>
        </AddMoreAction>
        {/* Check if the config allows more nesting, if it does, allow for adding more blocks */}
        <StyledTooltip
          content={
            <span>
              For S3 only 4 nested where <br /> condition group is allowed.
            </span>
          }
          disabled={props.currentNestingLevel < props.nestedLevels}
          donotUsePortal
          position="bottom"
        >
          <AddMoreAction
            className={`t--where-add-group-condition[${props?.currentNestingLevel}]`}
            isDisabled={!(props.currentNestingLevel < props.nestedLevels)}
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
            size={size}
          >
            <Icon name="add-more-fill" size={IconSize.XL} />
            <span style={{ marginLeft: "8px" }}>Add Group Condition</span>
          </AddMoreAction>
        </StyledTooltip>
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
