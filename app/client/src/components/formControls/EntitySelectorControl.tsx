import React from "react";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import { ControlProps } from "./BaseControl";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";
import { allowedControlTypes } from "components/formControls/utils";

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

// Component for the icons
const CenteredIcon = styled(Icon)<{ noMarginLeft?: boolean }>`
  margin: 13px;
  align-self: end;
  &.hide {
    opacity: 0;
    pointer-events: none;
  }
  color: ${Colors.GREY_7};
`;

// main container for the entity selector component
const EntitySelectorContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: min-content;
  justify-content: space-between;
`;

function EntitySelectorComponent(props: any) {
  const { configProperty, schema } = props;

  const maxWidthOfComponents = 45;
  let width = 15;
  if (schema.length > 0) {
    width = maxWidthOfComponents / schema.length;
  }
  const customStyles = {
    width: `${width}vw`,
  };

  return (
    <EntitySelectorContainer key={`ES_${configProperty}`}>
      {schema &&
        schema.length > 0 &&
        schema.map((singleSchema: any, index: number) => {
          return (
            allowedControlTypes.includes(singleSchema.controlType) && (
              <React.Fragment key={`ES_FRAG_${singleSchema.configProperty}`}>
                {singleSchema.controlType === "DROP_DOWN" ? (
                  <FormControl
                    config={{
                      ...dropDownFieldConfig,
                      ...singleSchema,
                      customStyles,
                      key: `ES_${singleSchema.configProperty}`,
                    }}
                    formName={props.formName}
                  />
                ) : (
                  <FormControl
                    config={{
                      ...inputFieldConfig,
                      ...singleSchema,
                      customStyles,
                      key: `ES_${singleSchema.configProperty}`,
                    }}
                    formName={props.formName}
                  />
                )}
                {index < schema.length - 1 && (
                  <CenteredIcon
                    key={`ES_ICON_${configProperty}`}
                    name="double-arrow-right"
                    size={IconSize.SMALL}
                  />
                )}
              </React.Fragment>
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
