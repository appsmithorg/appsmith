import React from "react";
import {
  StyledDividerContainer,
  StyledNavigateToFieldsContainer,
  StyledNavigateToFieldWrapper,
} from "components/propertyControls/StyledControls";
import DividerComponent from "widgets/DividerWidget/component";
import { FieldType } from "../constants";
import { FieldGroupProps } from "../types";
import { Field } from "../Field";

function FieldGroup(props: FieldGroupProps) {
  const { fields, ...otherProps } = props;

  if (fields[0].field === FieldType.ACTION_SELECTOR_FIELD) {
    const remainingFields = fields.slice(1);
    if (
      remainingFields[0]?.field ===
      FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD
    ) {
      /* Navigate to does not follow the tree like structure
       * other global functions have
       * This if condition achieves that design */
      return (
        <>
          {Field({
            ...otherProps,
            field: fields[0],
          })}

          <StyledNavigateToFieldWrapper>
            <StyledDividerContainer>
              <DividerComponent
                capType="dot"
                dividerColor="#b3b3b3"
                orientation="vertical"
                thickness={2}
              />
            </StyledDividerContainer>
            <StyledNavigateToFieldsContainer>
              {remainingFields.map((paramField: any) => {
                return Field({ field: paramField, ...otherProps });
              })}
            </StyledNavigateToFieldsContainer>
          </StyledNavigateToFieldWrapper>
        </>
      );
    }
    return (
      <>
        {Field({
          ...otherProps,
          field: fields[0],
        })}

        <ul className={props.depth === 1 ? "tree" : ""}>
          {remainingFields.map((field: any, index: number) => {
            if (Array.isArray(field)) {
              if (props.depth > props.maxDepth) {
                // eslint-disable-next-line react/jsx-no-useless-fragment
                return <></>;
              }
              const selectorField = field[0];
              return (
                <li key={index}>
                  <FieldGroup
                    activeNavigateToTab={props.activeNavigateToTab}
                    additionalAutoComplete={props.additionalAutoComplete}
                    depth={props.depth + 1}
                    fields={field}
                    integrationOptions={props.integrationOptions}
                    key={selectorField.label + index}
                    label={selectorField.label}
                    maxDepth={props.maxDepth}
                    modalDropdownList={props.modalDropdownList}
                    navigateToSwitches={props.navigateToSwitches}
                    onValueChange={(
                      value: any,
                      isUpdatedViaKeyboard: boolean,
                    ) => {
                      const parentValue =
                        selectorField.getParentValue &&
                        selectorField.getParentValue(
                          value.substring(2, value.length - 2),
                        );
                      props.onValueChange(
                        parentValue || value,
                        isUpdatedViaKeyboard,
                      );
                    }}
                    pageDropdownOptions={props.pageDropdownOptions}
                    value={selectorField.value}
                    widgetOptionTree={props.widgetOptionTree}
                  />
                </li>
              );
            } else {
              return (
                <li key={field.field + index}>
                  {Field({
                    field: field,
                    ...otherProps,
                  })}
                </li>
              );
            }
          })}
        </ul>
      </>
    );
  } else {
    const ui = fields.map((field: any, index: number) => {
      if (Array.isArray(field)) {
        if (props.depth > props.maxDepth) {
          // eslint-disable-next-line react/jsx-no-useless-fragment
          return <></>;
        }
        const selectorField = field[0];
        return (
          <FieldGroup
            activeNavigateToTab={props.activeNavigateToTab}
            depth={props.depth + 1}
            fields={field}
            integrationOptions={props.integrationOptions}
            key={index}
            label={selectorField.label}
            maxDepth={props.maxDepth}
            modalDropdownList={props.modalDropdownList}
            navigateToSwitches={props.navigateToSwitches}
            onValueChange={(value: any, isUpdatedViaKeyboard: boolean) => {
              const parentValue = selectorField.getParentValue(
                value.substring(2, value.length - 2),
              );
              props.onValueChange(parentValue, isUpdatedViaKeyboard);
            }}
            pageDropdownOptions={props.pageDropdownOptions}
            value={selectorField.value}
            widgetOptionTree={props.widgetOptionTree}
          />
        );
      } else {
        return Field({
          field: field,
          ...otherProps,
        });
      }
    });
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{ui}</>;
  }
}

export default FieldGroup;
