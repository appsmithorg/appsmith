import React, { useEffect, useRef } from "react";
import FormControl from "pages/Editor/FormControl";
import { Icon, IconSize } from "design-system-old";
import styled from "styled-components";
import { FieldArray, getFormValues } from "redux-form";
import { ControlProps } from "./BaseControl";
import _ from "lodash";
import { useSelector } from "react-redux";
import { getBindingOrConfigPathsForWhereClauseControl } from "entities/Action/actionProperties";
import { WhereClauseSubComponent } from "./utils";
import { TooltipComponent as Tooltip } from "design-system-old";
import useResponsiveBreakpoints from "utils/hooks/useResizeObserver";

//Dropdwidth and Icon have fixed widths
const DropdownWidth = 82; //pixel value
const OperatorDropdownWidth = 100; // operators should have longer dropdown widths.
const Margin = 8; //pixel value, space between two adjacent fields
//Offsets are pixel values adjusted for Margin = 8px, and DropdownWidth = 100px
//Offsets are used to calculate flexible width of Key and Value fields
//TODO: add logic to calculate width using DropdownWidth and Margin
const Offset = [248, 406, 564, 564];

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

// Wrapper inside the main box, contains the dropdown and ConditionWrapper
const SecondaryBox = styled.div<{ showBorder: boolean; size: string }>`
  display: flex;
  flex-direction: column;
  position: relative;
  border: solid 1.2px #e0dede;
  border-width: ${(props) => (props?.showBorder ? "1.2px" : "0px")};
  margin: ${(props) => (props?.showBorder ? "0px 8px" : "0px")};
  padding: ${(props) => (props?.showBorder ? "8px" : "0px")};
  padding-bottom: 24px;

  ${(props) =>
    props.size === "small" &&
    `
    width: 100%;
  `}
`;

// Wrapper to contain either a ConditionComponent or ConditionBlock
const ConditionWrapper = styled.div<{ size: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  gap: 8px;

  ${(props) =>
    props.size === "small" &&
    `
    gap: 0px;
    flex-direction: column;
    align-items: start;
  `}
`;

// Wrapper to contain a single condition statement
const ConditionBox = styled.div<{ size?: string }>`
  display: grid;
  grid-template-columns: repeat(4, max-content);
  grid-column-gap: 8px;
  grid-row-gap: 8px;
  width: 100%;
  margin: 4px 0px;

  :first-child {
    margin-top: 0px;
  }

  ${(props) =>
    props.size === "small" &&
    `
    grid-template-columns: repeat(2, max-content);
    grid-template-rows: repeat(3, max-content);

    & :not(:nth-child(4)) {
      grid-column-start: 1;
    }
  
    & :nth-child(4) {
      grid-column-start: 2;
      grid-row-start: 2;
    }
  `}
`;

// Box containing the action buttons to add more filters
const ActionBox = styled.div`
  display: flex;
  margin-top: 16px;
  flex-direction: row;
  width: max-content;
  justify-content: space-between;
  position: absolute;
  height: 24px;
  text-transform: uppercase;
  background-color: inherit;
  bottom: 0px;
`;

// The final button to add more filters/ filter groups
const AddMoreAction = styled.div<{ isDisabled?: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 14px;
  letter-spacing: 0.6px;
  margin-right: 20px;
  color: ${(props) =>
    props.isDisabled ? "var(--appsmith-color-black-300)" : "#858282;"};
`;

const GroupConditionBox = styled.div`
  display: flex;
  flex-direction: row;
  margin: 8px 0px;
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

  //flexWidth is the width of one Key or Value field
  //It is a function of DropdownWidth and Margin
  //fexWidth = maxWidth(set By WhereClauseControl) - Offset Values based on DropdownWidth and Margin
  const flexWidth = `${props.maxWidth / 2}vw - ${Offset[
    props.currentNestingLevel
  ] / 2}px`;

  return (
    <ConditionBox key={index} size={props.size}>
      {/* Component to input the LHS for single condition */}
      <FormControl
        config={{
          ...keyFieldConfig,
          configProperty: keyPath,
        }}
        formName={props.formName}
      />
      {/* Component to select the operator for the 2 inputs */}
      <FormControl
        config={{
          ...conditionFieldConfig,
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
  const size = useResponsiveBreakpoints(targetRef, [{ small: 776 }]);
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
                      marginTop: "4px",
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
                <GroupConditionBox className="GroupCondition">
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

      <ActionBox>
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
