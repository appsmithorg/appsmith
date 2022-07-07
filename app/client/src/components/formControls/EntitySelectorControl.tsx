import React from "react";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import { ControlProps, FormConfigType } from "./BaseControl";
import { allowedControlTypes } from "components/formControls/utils";

const dropDownFieldConfig: Partial<FormConfigType> = {
  label: "",
  controlType: "DROP_DOWN",
  fetchOptionsConditionally: true,
  options: [],
  customStyles: {
    width: "280px",
  },
};

const inputFieldConfig: Partial<FormConfigType> = {
  label: "",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  customStyles: {
    width: "280px",
  },
};

// main container for the entity selector component
const EntitySelectorContainer = styled.div`
  display: grid;
  grid-gap: 16px;
  grid-template-columns: repeat(auto-fill, 280px);
`;

const EntitySelectorWrapper = styled.div<{ marginRight: string }>`
  margin-right: ${(props) => props.marginRight};
`;

function EntitySelectorComponent(props: any) {
  const { configProperty, schema } = props;

  const visibleSchemas = schema.filter(
    (singleSchema: any) => !singleSchema.hidden,
  );

  return (
    <EntitySelectorContainer
      className={`t--${configProperty}`}
      key={`ES_${configProperty}`}
    >
      {visibleSchemas &&
        visibleSchemas.length > 0 &&
        visibleSchemas.map((singleSchema: any, index: number) => {
          return (
            allowedControlTypes.includes(singleSchema.controlType) &&
            !singleSchema.hidden && (
              <EntitySelectorWrapper
                key={`ES_FRAG_${singleSchema.configProperty}`}
                marginRight={index + 1 === visibleSchemas.length ? "" : "1rem"}
              >
                {singleSchema.controlType === "DROP_DOWN" ? (
                  <FormControl
                    config={{
                      ...dropDownFieldConfig,
                      ...singleSchema,
                      key: `ES_${singleSchema.configProperty}`,
                    }}
                    formName={props.formName}
                  />
                ) : (
                  <FormControl
                    config={{
                      ...inputFieldConfig,
                      ...singleSchema,
                      key: `ES_${singleSchema.configProperty}`,
                    }}
                    formName={props.formName}
                  />
                )}
              </EntitySelectorWrapper>
            )
          );
        })}
    </EntitySelectorContainer>
  );
}

// This is a wrapper component that just encapsulated the children dropdown and dynamic text
// components & changes their appearance
export default function EntitySelectorControl(
  props: EntitySelectorControlProps,
) {
  const {
    configProperty, // JSON path for the where clause data
    formName, // Name of the form, used by redux-form lib to store the data in redux store
    schema, // Schema is the array of objects that contains specific data for the ES
  } = props;

  return (
    <EntitySelectorComponent
      configProperty={configProperty}
      formName={formName}
      key={`ES_PARENT_${configProperty}`}
      name={configProperty}
      schema={schema}
    />
  );
}

export type EntitySelectorControlProps = ControlProps;
