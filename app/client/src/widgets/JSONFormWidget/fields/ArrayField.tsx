import React, { useState } from "react";
import styled from "styled-components";
import { ControllerRenderProps, useFormContext } from "react-hook-form";
import { Icon } from "@blueprintjs/core";
import { cloneDeep, pick } from "lodash";

import Accordion from "../component/Accordion";
import FieldLabel from "../component/FieldLabel";
import fieldRenderer from "./fieldRenderer";
import useDeepEffect from "utils/hooks/useDeepEffect";
import {
  ARRAY_ITEM_KEY,
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  SchemaItem,
} from "../constants";
import { Colors } from "constants/Colors";
import { FIELD_MARGIN_BOTTOM } from "../component/styleConstants";
import { generateReactKey } from "utils/generators";

type ArrayComponentProps = FieldComponentBaseProps & {
  isCollapsible: boolean;
  defaultValue?: any[];
};

type ArrayItemSchemaItemProps = SchemaItem & {
  backgroundColor?: string;
  borderColor?: string;
};

type ArrayFieldProps = BaseFieldComponentProps<ArrayComponentProps>;

const COMPONENT_DEFAULT_VALUES: ArrayComponentProps = {
  isCollapsible: true,
  isDisabled: false,
  isVisible: true,
  label: "",
};

const ACTION_ICON_SIZE = 10;

const StyledWrapper = styled.div`
  margin-bottom: ${FIELD_MARGIN_BOTTOM}px;
`;

const StyledItemWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const StyledButton = styled.button`
  align-items: center;
  color: ${Colors.GREEN};
  display: flex;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 10px;
  width: 80px;

  span.bp3-icon {
    margin-right: 6px;
  }
`;

const StyledDeleteButton = styled(StyledButton)`
  align-self: flex-end;
  color: ${Colors.CRIMSON};
`;
function ArrayField({ name, propertyPath, schemaItem }: ArrayFieldProps) {
  const { getValues, setValue } = useFormContext();
  const [keys, setKeys] = useState<string[]>([]);

  const { children, isVisible = true, label, tooltip } = schemaItem;
  const arrayItemSchema: ArrayItemSchemaItemProps = children[ARRAY_ITEM_KEY];
  const basePropertyPath = `${propertyPath}.children.${ARRAY_ITEM_KEY}`;

  const defaultValue = (() => {
    return !Array.isArray(schemaItem.defaultValue)
      ? []
      : (schemaItem.defaultValue as any[]);
  })();

  const options = {
    hideLabel: true,
    hideAccordion: true,
  };

  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  const add = () => {
    setKeys((prevKeys) => [...prevKeys, generateReactKey()]);
  };

  const remove = (removedKey: string) => {
    const removedIndex = keys.findIndex((key) => key === removedKey);
    const values = getValues(name);

    if (values === undefined) {
      return;
    }

    // Manually remove from the values and re-insert to maintain the position of the
    // values
    const newValues = values.filter(
      (_val: any, index: number) => index !== removedIndex,
    );

    setValue(name, newValues);

    setKeys((prevKeys) => prevKeys.filter((prevKey) => prevKey !== removedKey));
  };

  const reset = (values: any[]) => {
    const newKeys = values?.map(generateReactKey);

    setKeys(newKeys);
    setValue(name, cloneDeep(values));
  };

  useDeepEffect(() => {
    reset(defaultValue);
  }, [defaultValue]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <FieldLabel label={label} labelStyles={labelStyles} tooltip={tooltip} />
      <StyledWrapper>
        {keys.map((key, index) => {
          const fieldName = `${name}[${index}]` as ControllerRenderProps["name"];
          const fieldPropertyPath = `${basePropertyPath}.children.${arrayItemSchema.name}`;

          return (
            <Accordion
              backgroundColor={arrayItemSchema.backgroundColor}
              borderColor={arrayItemSchema.borderColor}
              isCollapsible={schemaItem.isCollapsible}
              key={key}
              title={`#${index}`}
            >
              <StyledItemWrapper>
                {fieldRenderer(
                  fieldName,
                  arrayItemSchema,
                  fieldPropertyPath,
                  options,
                )}
                <StyledDeleteButton onClick={() => remove(key)} type="button">
                  <Icon
                    icon="trash"
                    iconSize={ACTION_ICON_SIZE}
                    style={{ color: Colors.CRIMSON }}
                  />
                  Delete
                </StyledDeleteButton>
              </StyledItemWrapper>
            </Accordion>
          );
        })}
        <StyledButton onClick={add} type="button">
          <Icon
            icon="add"
            iconSize={ACTION_ICON_SIZE}
            style={{ color: Colors.GREEN }}
          />
          Add New
        </StyledButton>
      </StyledWrapper>
    </>
  );
}

ArrayField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default ArrayField;
