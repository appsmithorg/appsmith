import React from "react";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import { ControlProps } from "./BaseControl";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";

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

  const maxWidthOfComponents = 45;
  let width = 15;
  if (schema.length > 0) {
    width = maxWidthOfComponents / schema.length;
  }
  const customStyles = {
    width: `${width}vw`,
  };

  return (
    <EntitySelectorContainer>
      {schema &&
        schema.length > 0 &&
        schema.map(
          (singleSchema: any, index: number) =>
            allowedControlTypes.includes(singleSchema.controlType) && (
              <>
                {singleSchema.controlType === "DROP_DOWN" ? (
                  <FormControl
                    config={{
                      ...dropDownFieldConfig,
                      ...singleSchema,
                      customStyles,
                      configProperty: `${configProperty}.column_${index + 1}`,
                      key: `${configProperty}.column_${index + 1}`,
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
                      key: `${configProperty}.column_${index + 1}`,
                    }}
                    formName={props.formName}
                  />
                )}
                {index < schema.length - 1 && (
                  <CenteredIcon
                    name="double-arrow-right"
                    size={IconSize.SMALL}
                  />
                )}
              </>
            ),
        )}
    </EntitySelectorContainer>
  );
}

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
      key={configProperty}
      name={configProperty}
      schema={schema}
    />
  );
}

export type EntitySelectorControlProps = ControlProps;
