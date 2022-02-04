import React, { useEffect } from "react";
import FormControl from "pages/Editor/FormControl";
import Icon, { IconSize } from "components/ads/Icon";
import styled, { css } from "styled-components";
import { FieldArray } from "redux-form";
import FormLabel from "components/editorComponents/FormLabel";
import { ControlProps } from "./BaseControl";
import { Colors } from "constants/Colors";

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
  width: 30vw;
  margin-right: 1rem;
`;

// container for the order dropdown section
const OrderDropdownContainer = styled.div`
  width: 15vw;
`;

// Component for the icons
const CenteredIcon = styled(Icon)<{ noMarginLeft?: boolean }>`
  margin-left: 10px;
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
const StyledBottomLabelContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: ${Colors.GREY_7};
  cursor: pointer;
  width: max-content;
  &:hover {
    opacity: 0.8;
  }
`;

export const StyledBottomLabel = styled(FormLabel)`
  margin-left: 5px;
  font-weight: 400;
  font-size: 12px;
  color: ${Colors.GREY_7};
  line-height: 16px;
`;

function SortingComponent(props: any) {
  const columnCustomStyles = {
    width: "100%",
    height: "30px",
  };

  const orderCustomStyles = {
    width: "15vw",
    height: "30px",
  };

  const onDeletePressed = (index: number) => {
    props.fields.remove(index);
  };

  useEffect(() => {
    if (props.fields.length < 1) {
      props.fields.push({
        column: "",
        order: OrderDropDownValues.ASCENDING,
      });
    } else {
      onDeletePressed(props.index);
    }
  }, [props.fields.length]);

  return (
    <SortingContainer>
      {props.fields &&
        props.fields.length > 0 &&
        props.fields.map((field: any, index: number) => (
          <SortingDropdownContainer key={index}>
            <ColumnDropdownContainer>
              <FormControl
                config={{
                  ...columnFieldConfig,
                  customStyles: columnCustomStyles,
                  configProperty: `${field}.column`,
                  nestedFormControl: true,
                }}
                formName={props.formName}
              />
            </ColumnDropdownContainer>
            <OrderDropdownContainer>
              <FormControl
                config={{
                  ...orderFieldConfig,
                  customStyles: orderCustomStyles,
                  configProperty: `${field}.order`,
                  nestedFormControl: true,
                }}
                formName={props.formName}
              />
            </OrderDropdownContainer>
            {/* Component to render the delete icon */}
            {index !== 0 && (
              <CenteredIcon
                name="cross"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePressed(index);
                }}
                size={IconSize.SMALL}
              />
            )}
          </SortingDropdownContainer>
        ))}

      <StyledBottomLabelContainer
        onClick={() =>
          props.fields.push({
            column: "",
            order: OrderDropDownValues.ASCENDING,
          })
        }
      >
        <CenteredIcon name="add-more-fill" noMarginLeft size={IconSize.SMALL} />
        <StyledBottomLabel>Add Another sort Parameter</StyledBottomLabel>
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
