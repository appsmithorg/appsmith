import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import FormControl from "pages/Editor/FormControl";
import { Classes, Icon, IconSize } from "design-system-old";
import styled, { css } from "styled-components";
import { FieldArray, getFormValues } from "redux-form";
import type { ControlProps } from "./BaseControl";
import { Colors } from "constants/Colors";
import { getBindingOrConfigPathsForSortingControl } from "entities/Action/actionProperties";
import { SortingSubComponent } from "./utils";
import { get, isArray } from "lodash";
import useResponsiveBreakpoints from "utils/hooks/useResponsiveBreakpoints";

// sorting's order dropdown values
enum OrderDropDownValues {
  ASCENDING = "Ascending",
  DESCENDING = "Descending",
}

// Form config for the column field
const columnFieldConfig: any = {
  key: "column",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  initialValue: "",
  inputType: "TEXT",
  placeholderText: "Column name",
  customStyles: {
    width: "280px",
  },
};

// Form config for the order field
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

// main container for the fsorting component
const SortingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

// container for the two sorting dropdown
const SortingDropdownContainer = styled.div<{ size: string }>`
  display: flex;
  flex-direction: row;
  width: min-content;
  justify-content: space-between;
  margin-bottom: 10px;

  // Hide the icon by default
  .t--form-control-DROP_DOWN .remixicon-icon {
    display: none;
  }
  // We still want the dropdown to show the 'expand-more' icon
  .t--form-control-DROP_DOWN span[name="expand-more"] .remixicon-icon {
    display: initial;
  }
  ${(props) =>
    props.size === "small" &&
    `
  // Hide the dropdown labels to decrease the width
  // The design system component has inline style hence the !important
  .t--form-control-DROP_DOWN .${Classes.TEXT} {
    display: none !important;
  }
  // Show the icons hidden initially
  .t--form-control-DROP_DOWN .remixicon-icon {
    display: initial;
  }
  `}
`;

// container for the column dropdown section
const ColumnDropdownContainer = styled.div`
  margin-right: 1rem;
`;

// Component for the icons
const CenteredIcon = styled(Icon)<{ noMarginLeft?: boolean }>`
  margin-left: 8px;
  align-self: end;
  margin-bottom: 10px;
  &.hide {
    opacity: 0;
    pointer-events: none;
  }
  color: ${Colors.GREY_7};

  ${(props) =>
    props.noMarginLeft &&
    css`
      margin-left: 0px;
    `}
`;

// container for the bottom label section
const StyledBottomLabelContainer = styled.div<{ isDisabled?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 14px;
  letter-spacing: 0.6px;
  margin-right: 20px;
  color: ${(props) =>
    props.isDisabled ? "var(--appsmith-color-black-300)" : "#858282;"};
  cursor: pointer;
  width: max-content;
  text-transform: uppercase;
`;

export const StyledBottomLabel = styled.span`
  margin-left: 8px;
`;

function SortingComponent(props: any) {
  const formValues: any = useSelector((state) =>
    getFormValues(props.formName)(state),
  );

  const onDeletePressed = (index: number) => {
    props.fields.remove(index);
  };

  const targetRef = useRef<HTMLDivElement>(null);
  const size = useResponsiveBreakpoints(targetRef, [{ small: 450 }]);
  const isBreakpointSmall = size === "small";

  useEffect(() => {
    // this path represents the path to the sortBy object, wherever the location is in the actionConfiguration object
    let sortingObjectPath;
    // if the path ends with .data which we expect it to.
    if (props.configProperty.endsWith(".data")) {
      // we remove the .data and get the path of the sort object
      // NOTE: 5 is used because (.data) = 5
      sortingObjectPath = props.configProperty.substring(
        0,
        props.configProperty.length - 5,
      );
    }
    // sortDataValue is the path to the value (.data included) itself in the sort object
    const sortDataValue = get(formValues, props.configProperty);
    // sort object value is the path to the sort object itself.
    const sortObjectValue = get(formValues, sortingObjectPath);

    // The reason we are making this check is to prevent new fields from being pushed when the form control is visited
    // for some reason the fields object is initially undefined in first render, before being initialized with the correct values after.
    // so we check to see if the sortObjectValue exist first (if the value has been initalized).
    if (!sortObjectValue) {
      return;
    }

    // then we check if the redux fields have any items in it,
    // and we also check if the value exists in the redux state as an array and if that value has no items in it.
    // if they are both empty we want to push a new field.
    // We also want to check if the value is undefined, this means that the sort data value is non existent, if it is, we want to push a new field.
    if (
      (props.fields.length < 1 &&
        isArray(sortDataValue) &&
        sortDataValue.length < 1) ||
      (props.fields.length < 1 && !sortDataValue)
    ) {
      props.fields.push({
        column: "",
        order: OrderDropDownValues.ASCENDING,
      });
    } else {
      onDeletePressed(props.index);
    }
  }, [props.fields.length]);

  return (
    <SortingContainer className={`t--${props?.configProperty}`} ref={targetRef}>
      {props.fields &&
        props.fields.length > 0 &&
        props.fields.map((field: any, index: number) => {
          const columnPath = getBindingOrConfigPathsForSortingControl(
            SortingSubComponent.Column,
            field,
            undefined,
          );
          const OrderPath = getBindingOrConfigPathsForSortingControl(
            SortingSubComponent.Order,
            field,
            undefined,
          );
          return (
            <SortingDropdownContainer key={index} size={size}>
              <ColumnDropdownContainer>
                <FormControl
                  config={{
                    ...columnFieldConfig,
                    configProperty: `${columnPath}`,
                    nestedFormControl: true,
                  }}
                  formName={props.formName}
                />
              </ColumnDropdownContainer>
              <FormControl
                config={{
                  ...orderFieldConfig,
                  configProperty: `${OrderPath}`,
                  nestedFormControl: true,
                  customStyles: {
                    width: isBreakpointSmall ? "65px" : "144px",
                  },
                  optionWidth: isBreakpointSmall ? "144px" : undefined,
                }}
                formName={props.formName}
              />
              {/* Component to render the delete icon */}
              <CenteredIcon
                cypressSelector={`t--sorting-delete-[${index}]`}
                name="cross"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDeletePressed(index);
                }}
                size={IconSize.SMALL}
              />
            </SortingDropdownContainer>
          );
        })}
      <StyledBottomLabelContainer
        data-cy={`t--sorting-add-field`}
        onClick={() =>
          props.fields.push({
            column: "",
            order: OrderDropDownValues.ASCENDING,
          })
        }
      >
        <Icon name="add-more-fill" size={IconSize.XL} />
        <StyledBottomLabel>Add Parameter</StyledBottomLabel>
      </StyledBottomLabelContainer>
    </SortingContainer>
  );
}

export default function SortingControl(props: SortingControlProps) {
  const {
    configProperty, // JSON path for the where clause data
    formName, // Name of the form, used by redux-form lib to store the data in redux store
  } = props;

  return (
    <FieldArray
      component={SortingComponent}
      key={`${configProperty}`}
      name={`${configProperty}`}
      props={{
        configProperty,
        formName,
      }}
      rerenderOnEveryChange={false}
    />
  );
}

export type SortingControlProps = ControlProps;
