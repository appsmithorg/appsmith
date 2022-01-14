import React from "react";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import { ControlProps } from "./BaseControl";
import { Colors } from "constants/Colors";

const dropDownFieldConfig: any = {
  label: "",
  controlType: "DROP_DOWN",
  fetchOptionsCondtionally: true,
  options: [],
};

const inputFieldConfig: any = {
  label: "",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
};

const allowedControlTypes = ["DROP_DOWN", "QUERY_DYNAMIC_INPUT_TEXT"];

// main container for the entity selector component
const EntitySelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: min-content;
  justify-content: space-between;
`;

export const StyledBottomLabel = styled(FormLabel)`
  margin-top: 5px;
  margin-left: 5px;
  font-weight: 400;
  font-size: 12px;
  color: ${Colors.GREY_7};
  line-height: 16px;
`;

function EntitySelectorComponent(props: any) {
  const { configProperty, schema } = props;

  const customStyles = {
    width: `100%`,
    height: "30px",
  };

  return (
    <EntitySelectorContainer>
      {schema &&
        schema.length > 0 &&
        schema.map(
          (singleSchema: any, index: number) =>
            allowedControlTypes.includes(singleSchema.controlType) &&
            (singleSchema.controlType === "DROP_DOWN" ? (
              <FormControl
                config={{
                  ...dropDownFieldConfig,
                  ...singleSchema,
                  customStyles,
                  configProperty: `${configProperty}.column_${index + 1}`,
                }}
                formName={props.formName}
              />
            ) : (
              <FormControl
                config={{
                  ...inputFieldConfig,
                  ...singleSchema,
                  customStyles,
                  configProperty: `${configProperty}.column_${index + 1}`,
                }}
                formName={props.formName}
              />
            )),
        )}
    </EntitySelectorContainer>
  );
}

export default function EntitySelectorControl(
  props: EntitySelectorControlProps,
) {
  const {
    configProperty,
    formName, // JSON path for the where clause data
    schema, // Name of the form, used by redux-form lib to store the data in redux store
  } = props;

  return (
    <EntitySelectorComponent
      configProperty={configProperty}
      formName={formName}
      name={configProperty}
      schema={schema}
    />
  );
}

export type EntitySelectorControlProps = ControlProps;
