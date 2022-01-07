import React, { useContext, useState } from "react";
import styled from "styled-components";
import { ControllerRenderProps, useFormContext } from "react-hook-form";
import { Icon } from "@blueprintjs/core";
import { cloneDeep, get, pick, set } from "lodash";

import Accordion from "../component/Accordion";
import FieldLabel from "../component/FieldLabel";
import fieldRenderer from "./fieldRenderer";
import useDeepEffect from "utils/hooks/useDeepEffect";
import {
  ARRAY_ITEM_KEY,
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldState,
} from "../constants";
import { Colors } from "constants/Colors";
import { FIELD_MARGIN_BOTTOM } from "../component/styleConstants";
import { generateReactKey } from "utils/generators";
import FormContext from "../FormContext";
import NestedFormWrapper from "../component/NestedFormWrapper";

type ArrayComponentProps = FieldComponentBaseProps & {
  backgroundColor?: string;
  cellBackgroundColor?: string;
  cellBorderColor?: string;
  defaultValue?: any[];
  isCollapsible: boolean;
};

type ArrayFieldProps = BaseFieldComponentProps<ArrayComponentProps>;

const COMPONENT_DEFAULT_VALUES: ArrayComponentProps = {
  backgroundColor: Colors.GREY_1,
  isCollapsible: true,
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
};

const ACTION_ICON_SIZE = 10;

const StyledNestedFormWrapper = styled(NestedFormWrapper)`
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
  const { setFieldValidityState } = useContext(FormContext);

  const {
    backgroundColor,
    cellBackgroundColor,
    cellBorderColor,
    children,
    isVisible = true,
    label,
    tooltip,
  } = schemaItem;
  const arrayItemSchema = children[ARRAY_ITEM_KEY];
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

  /**
   * If array field is reset/array items are removed, the field Validity
   * should reflect that change. This block ensures only when there is a
   * decrease of array items, we remove the last n removed items as the rest
   * would auto correct it self by individual field using useRegisterFieldInvalid hook
   */
  useDeepEffect(() => {
    setFieldValidityState((prevState) => {
      const fieldValidity = cloneDeep(prevState.fieldValidity);
      const currFieldValidity: FieldState<{ isValid: true }> = get(
        fieldValidity,
        name,
        [],
      );

      if (Array.isArray(currFieldValidity)) {
        if (currFieldValidity.length > keys.length) {
          const updatedFieldValidity = currFieldValidity.slice(0, keys.length);

          set(fieldValidity, name, updatedFieldValidity);
        }
      }

      return {
        ...prevState,
        fieldValidity,
      };
    });
  }, [keys]);

  if (!isVisible) {
    return null;
  }

  return (
    <StyledNestedFormWrapper
      backgroundColor={backgroundColor}
      className={`t--jsonformfield-${name}`}
    >
      <FieldLabel label={label} labelStyles={labelStyles} tooltip={tooltip} />
      {keys.map((key, index) => {
        const fieldName = `${name}[${index}]` as ControllerRenderProps["name"];
        const fieldPropertyPath = `${basePropertyPath}.children.${arrayItemSchema.name}`;

        return (
          <Accordion
            backgroundColor={cellBackgroundColor}
            borderColor={cellBorderColor}
            isCollapsible={schemaItem.isCollapsible}
            key={key}
            title={`${index + 1}`}
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
    </StyledNestedFormWrapper>
  );
}

ArrayField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default ArrayField;
