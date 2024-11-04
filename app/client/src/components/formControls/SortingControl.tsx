import React, { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import {
  FieldArray,
  getFormValues,
  type WrappedFieldArrayProps,
} from "redux-form";
import type { ControlProps } from "./BaseControl";
import { getBindingOrConfigPathsForSortingControl } from "entities/Action/actionProperties";
import { SortingSubComponent } from "./utils";
import { get, isArray } from "lodash";
import useResponsiveBreakpoints from "utils/hooks/useResponsiveBreakpoints";
import { Button } from "@appsmith/ads";

// sorting's order dropdown values
enum OrderDropDownValues {
  ASCENDING = "Ascending",
  DESCENDING = "Descending",
}

// Form config for the column field
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columnFieldConfig: any = {
  key: "column",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  initialValue: "",
  inputType: "TEXT",
  placeholderText: "Column name",
};

// Form config for the order field
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const orderFieldConfig: any = {
  key: "order",
  controlType: "DROP_DOWN",
  initialValue: OrderDropDownValues.ASCENDING,
  options: [
    {
      label: OrderDropDownValues.ASCENDING,
      value: OrderDropDownValues.ASCENDING,
      icon: "sort-asc",
    },
    {
      label: OrderDropDownValues.DESCENDING,
      value: OrderDropDownValues.DESCENDING,
      icon: "sort-desc",
    },
  ],
};

const SortingContainer = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-4);
  flex-direction: column;
  border-top: 1px solid var(--ads-v2-color-border);
  padding-top: var(--ads-v2-spaces-4);
`;

const SortingDropdownContainer = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-4);
`;

const SortingFields = styled.div<{ isBreakpointSmall: boolean }>`
  display: grid;
  grid-template-columns: ${({ isBreakpointSmall }) =>
    isBreakpointSmall ? "1fr" : "1fr 180px"};
  grid-template-rows: ${({ isBreakpointSmall }) =>
    isBreakpointSmall ? "1fr 1fr" : "1fr"};
  column-gap: var(--ads-v2-spaces-4);
  row-gap: var(--ads-v2-spaces-2);
  width: 100%;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

export type SortingControlProps = ControlProps;

export type SortingComponentProps = WrappedFieldArrayProps &
  Pick<SortingControlProps, "configProperty" | "formName">;

function SortingComponent(props: SortingComponentProps) {
  const { configProperty, fields, formName } = props;

  const formValues = useSelector((state) =>
    getFormValues(props.formName)(state),
  );

  const onDeletePressed = (index: number) => {
    fields.remove(index);
  };

  const targetRef = useRef<HTMLDivElement>(null);
  const size = useResponsiveBreakpoints(targetRef, [{ small: 450 }]);
  const isBreakpointSmall = size === "small";

  useEffect(() => {
    // if the path ends with .data which we expect it to.
    if (configProperty.endsWith(".data")) {
      // we remove the .data and get the path of the sort object
      // NOTE: 5 is used because (.data) = 5
      const sortingObjectPath = configProperty.substring(
        0,
        configProperty.length - 5,
      );

      // sortDataValue is the path to the value (.data included) itself in the sort object
      const sortDataValue = get(formValues, configProperty);
      // sort object value is the path to the sort object itself.
      const sortObjectValue = get(formValues, sortingObjectPath);

      // The reason we are making this check is to prevent new fields from being pushed when the form control is visited
      // for some reason the fields object is initially undefined in first render, before being initialized with the correct values after.
      // so we check to see if the sortObjectValue exist first (if the value has been initalized).
      if (sortObjectValue) {
        // then we check if the redux fields have any items in it,
        // and we also check if the value exists in the redux state as an array and if that value has no items in it.
        // if they are both empty we want to push a new field.
        // We also want to check if the value is undefined, this means that the sort data value is non existent, if it is, we want to push a new field.
        if (
          (fields.length < 1 &&
            isArray(sortDataValue) &&
            sortDataValue.length < 1) ||
          (fields.length < 1 && !sortDataValue)
        ) {
          fields.push({
            column: "",
            order: OrderDropDownValues.ASCENDING,
          });
        }
      }
    }
  }, [fields.length]);

  return (
    <SortingContainer className={`t--${props?.configProperty}`} ref={targetRef}>
      {fields &&
        fields.length > 0 &&
        fields.map((field, index: number) => {
          const columnPath = getBindingOrConfigPathsForSortingControl(
            SortingSubComponent.Column,
            field,
          );

          const orderPath = getBindingOrConfigPathsForSortingControl(
            SortingSubComponent.Order,
            field,
          );

          return (
            <SortingDropdownContainer
              className="sorting-dropdown-container"
              key={index}
            >
              <SortingFields isBreakpointSmall={isBreakpointSmall}>
                <FormControl
                  config={{
                    ...columnFieldConfig,
                    configProperty: columnPath,
                    nestedFormControl: true,
                  }}
                  formName={formName}
                />
                <FormControl
                  config={{
                    ...orderFieldConfig,
                    customStyles: {
                      maxWidth: "180px",
                    },
                    configProperty: orderPath,
                    nestedFormControl: true,
                  }}
                  formName={formName}
                />
              </SortingFields>
              <Button
                data-testid={`t--sorting-delete-[${index}]`}
                isIconButton
                kind="tertiary"
                onClick={() => {
                  onDeletePressed(index);
                }}
                size="md"
                startIcon="close-line"
                value={index}
              />
            </SortingDropdownContainer>
          );
        })}
      <ButtonWrapper>
        <Button
          data-testid={`t--sorting-add-field`}
          kind="tertiary"
          onClick={() =>
            fields.push({
              column: "",
              order: OrderDropDownValues.ASCENDING,
            })
          }
          size="md"
          startIcon="add-more"
        >
          Add Parameter
        </Button>
      </ButtonWrapper>
    </SortingContainer>
  );
}

export default function SortingControl(props: SortingControlProps) {
  const {
    configProperty, // JSON path for the where clause data
    formName, // Name of the form, used by redux-form lib to store the data in redux store
  } = props;

  const fieldArrayProps = useMemo(
    () => ({ configProperty, formName }),
    [configProperty, formName],
  );

  return (
    <FieldArray
      component={SortingComponent}
      key={configProperty}
      name={configProperty}
      props={fieldArrayProps}
      rerenderOnEveryChange={false}
    />
  );
}
