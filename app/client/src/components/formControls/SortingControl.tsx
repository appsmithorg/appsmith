import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import FormControl from "pages/Editor/FormControl";
import Icon, { IconSize } from "components/ads/Icon";
import styled, { css } from "styled-components";
import { FieldArray, getFormValues } from "redux-form";
import { ControlProps } from "./BaseControl";
import { Colors } from "constants/Colors";
import { getBindingOrConfigPathsForSortingControl } from "entities/Action/actionProperties";
import { SortingSubComponent } from "./utils";
import { get, isArray } from "lodash";

// sorting's order dropdown values
enum OrderDropDownValues {
  ASCENDING = "Ascending",
  DESCENDING = "Descending",
}

// Form config for the column field
const columnFieldConfig: any = {
  key: "column",
  // controlType: "DROP_DOWN",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  initialValue: "",
  // options: [],
  inputType: "TEXT",
  // placeholderText: "Select Column",
  placeholderText: "Column name",
  customStyles: {
    width: "25vw",
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
    },
    {
      label: OrderDropDownValues.DESCENDING,
      value: OrderDropDownValues.DESCENDING,
    },
  ],
  customStyles: {
    width: "10vw",
  },
};

// main container for the fsorting component
const SortingContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: min-content;
  justify-content: space-between;
`;

// container for the two sorting dropdown
const SortingDropdownContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: min-content;
  justify-content: space-between;
  margin-bottom: 10px;
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
    // and if after it has been initalized the data value is not an array (which we expect it to be) it means the data value has not been assigned a value yet
    if (!!sortObjectValue && !isArray(sortDataValue)) {
      // then we check if the fields have any items in it, if it does not, we push an empty field.
      if (props.fields.length < 1) {
        props.fields.push({
          column: "",
          order: OrderDropDownValues.ASCENDING,
        });
      } else {
        onDeletePressed(props.index);
      }
    }
  }, [props.fields.length]);

  return (
    <SortingContainer>
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
            <SortingDropdownContainer key={index}>
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
                }}
                formName={props.formName}
              />
              {/* Component to render the delete icon */}
              <CenteredIcon
                name="cross"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePressed(index);
                }}
                size={IconSize.SMALL}
              />
            </SortingDropdownContainer>
          );
        })}
      <StyledBottomLabelContainer
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
