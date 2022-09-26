import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { ControllerRenderProps, useFormContext } from "react-hook-form";
import { get, set } from "lodash";
import { Icon } from "@blueprintjs/core";
import { klona } from "klona";

import Accordion from "../component/Accordion";
import FieldLabel, { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";
import FieldRenderer from "./FieldRenderer";
import FormContext from "../FormContext";
import NestedFormWrapper from "../component/NestedFormWrapper";
import useDeepEffect from "utils/hooks/useDeepEffect";
import useUpdateAccessor from "./useObserveAccessor";
import {
  ARRAY_ITEM_KEY,
  BaseFieldComponentProps,
  FieldComponent,
  FieldComponentBaseProps,
  FieldState,
  SchemaItem,
} from "../constants";
import { Colors } from "constants/Colors";
import { FIELD_MARGIN_BOTTOM } from "../component/styleConstants";
import { generateReactKey } from "utils/generators";
import { schemaItemDefaultValue } from "../helper";

type ArrayComponentProps = FieldComponentBaseProps & {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: string;
  boxShadow?: string;
  cellBackgroundColor?: string;
  cellBorderColor?: string;
  cellBorderWidth?: number;
  cellBorderRadius?: string;
  cellBoxShadow?: string;
  accentColor?: string;
  defaultValue?: any[];
  isCollapsible: boolean;
};

type ArrayFieldProps = BaseFieldComponentProps<ArrayComponentProps>;

type StyledButtonProps = {
  color?: string;
};

const COMPONENT_DEFAULT_VALUES: ArrayComponentProps = {
  backgroundColor: Colors.GREY_1,
  isCollapsible: true,
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  labelTextSize: BASE_LABEL_TEXT_SIZE,
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

const StyledButton = styled.button<StyledButtonProps>`
  align-items: center;
  color: ${({ color }) => color || Colors.GREEN};
  display: flex;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 10px;
  width: 80px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;

    & * {
      pointer-events: none;
    }
  }

  span.bp3-icon {
    margin-right: 6px;
  }
`;

const StyledDeleteButton = styled(StyledButton)`
  align-self: flex-end;
  color: ${Colors.CRIMSON};
`;

const DEFAULT_FIELD_RENDERER_OPTIONS = {
  hideLabel: true,
  hideAccordion: true,
};

/**
 * TODO(Ashit): The +1 to the ACTION_ICON_SIZE is an eye-balled value to center
 * align the icon and the text (Add new / Remove). The icon seems to
 * have an odd height which leads to this inconsistency and needs to be further
 * investigated
 */

const StyledIconWrapper = styled.div`
  display: flex;
  align-items: center;

  & span {
    height: ${ACTION_ICON_SIZE + 1}px;
  }
`;

const deleteIcon = (
  <StyledIconWrapper>
    <Icon
      icon="trash"
      iconSize={ACTION_ICON_SIZE}
      style={{ color: Colors.CRIMSON }}
    />
  </StyledIconWrapper>
);

const getDefaultValue = (
  schemaItem: SchemaItem,
  passedDefaultValue?: unknown,
) => {
  if (
    Array.isArray(schemaItem.defaultValue) &&
    schemaItem.defaultValue.length > 0
  ) {
    return schemaItemDefaultValue(schemaItem, "identifier") as unknown[];
  }

  if (Array.isArray(passedDefaultValue)) {
    return passedDefaultValue;
  }

  return [];
};

function ArrayField({
  fieldClassName,
  name,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: ArrayFieldProps) {
  const { getValues, setValue, watch } = useFormContext();
  const keysRef = useRef<string[]>([]);
  const removedKeys = useRef<string[]>([]);
  const defaultValue = getDefaultValue(schemaItem, passedDefaultValue);
  const value = watch(name);
  const valueLength = value?.length || 0;
  const [cachedDefaultValue, setCachedDefaultValue] = useState<unknown[]>(
    defaultValue,
  );

  useUpdateAccessor({ accessor: schemaItem.accessor });

  const { setMetaInternalFieldState } = useContext(FormContext);

  const add = () => {
    let values = klona(getValues(name));
    if (values && values.length) {
      values.push({});
    } else {
      values = [{}];
    }
    setValue(name, values);
  };

  const remove = useCallback(
    (removedKey: string) => {
      const values = klona(getValues(name));
      if (values === undefined) {
        return;
      }

      const removedIndex = keysRef.current.findIndex(
        (key) => key === removedKey,
      );

      // If the array has some default value passed from the sourceData
      // and the default array item is removed then we need to remove the
      // same index data from the default value in order to avoid that
      // data to get populated when add button is clicked as we use
      // cachedDefaultValue[index] in the FieldRenderer
      if (removedIndex < cachedDefaultValue.length) {
        setCachedDefaultValue((prevDefaultValue) => {
          const clonedValue = klona(prevDefaultValue);

          clonedValue.splice(removedIndex, 1);

          return clonedValue;
        });
      }

      // Manually remove from the values and re-insert to maintain the position of the
      // values
      const newValues = klona(
        values.filter((_val: any, index: number) => index !== removedIndex),
      );

      removedKeys.current = [removedKey];

      setValue(name, newValues);
    },
    [cachedDefaultValue, keysRef, setValue, getValues],
  );

  const itemKeys = useMemo(() => {
    if (keysRef.current.length > valueLength) {
      if (removedKeys.current.length > 0) {
        const removedKey = removedKeys.current[0];
        const prevKeys: string[] = [...keysRef.current];
        const newKeys = prevKeys.filter((prevKey) => prevKey !== removedKey);

        keysRef.current = newKeys;
        removedKeys.current = [];
      } else {
        const diff = keysRef.current.length - valueLength;
        const newKeys = [...keysRef.current];
        newKeys.splice(-1 * diff);

        keysRef.current = newKeys;
      }
    } else if (keysRef.current.length < valueLength) {
      const diff = valueLength - keysRef.current.length;

      const newKeys = Array(diff)
        .fill(0)
        .map(generateReactKey);

      keysRef.current = [...keysRef.current, ...newKeys];
    }

    return keysRef.current;
  }, [valueLength]);

  useDeepEffect(() => {
    setValue(name, klona(defaultValue));
    setCachedDefaultValue(klona(defaultValue));
  }, [defaultValue]);

  /**
   * If array field is reset/array items are removed, the field metaInternalState
   * should reflect that change. This block ensures only when there is a
   * decrease of array items, we remove the last n removed items as the rest
   * would auto correct it self by individual field using useRegisterFieldInvalid hook
   */
  useDeepEffect(() => {
    setMetaInternalFieldState((prevState) => {
      const metaInternalFieldState = klona(prevState.metaInternalFieldState);
      const currMetaInternalFieldState: FieldState<{ isValid: true }> = get(
        metaInternalFieldState,
        name,
        [],
      );

      if (Array.isArray(currMetaInternalFieldState)) {
        if (currMetaInternalFieldState.length > itemKeys.length) {
          const updatedMetaInternalFieldState = currMetaInternalFieldState.slice(
            0,
            itemKeys.length,
          );

          set(metaInternalFieldState, name, updatedMetaInternalFieldState);
        }
      }

      return {
        ...prevState,
        metaInternalFieldState,
      };
    });
  }, [itemKeys, name]);

  const fields = useMemo(() => {
    const arrayItemSchema = schemaItem.children[ARRAY_ITEM_KEY];

    const fieldPropertyPath = `${propertyPath}.children.${ARRAY_ITEM_KEY}`;

    return itemKeys.map((key, index) => {
      const fieldName = `${name}[${index}]` as ControllerRenderProps["name"];

      return (
        <Accordion
          backgroundColor={schemaItem.cellBackgroundColor}
          borderColor={schemaItem.cellBorderColor}
          borderRadius={schemaItem.cellBorderRadius}
          borderWidth={schemaItem.cellBorderWidth}
          boxShadow={schemaItem.cellBoxShadow}
          className={`t--jsonformfield-${fieldClassName}-item t--item-${index}`}
          isCollapsible={schemaItem.isCollapsible}
          key={key}
          title={`${index + 1}`}
        >
          <StyledItemWrapper>
            <FieldRenderer
              fieldName={fieldName}
              options={DEFAULT_FIELD_RENDERER_OPTIONS}
              passedDefaultValue={cachedDefaultValue[index]}
              propertyPath={fieldPropertyPath}
              schemaItem={arrayItemSchema}
            />
            <StyledDeleteButton
              className="t--jsonformfield-array-delete-btn"
              disabled={schemaItem.isDisabled}
              onClick={schemaItem.isDisabled ? undefined : () => remove(key)}
              type="button"
            >
              {deleteIcon}
              <span className="t--text">Delete</span>
            </StyledDeleteButton>
          </StyledItemWrapper>
        </Accordion>
      );
    });
  }, [
    cachedDefaultValue,
    fieldClassName,
    itemKeys,
    name,
    propertyPath,
    remove,
    schemaItem,
  ]);

  if (!schemaItem.isVisible) {
    return null;
  }

  return (
    <StyledNestedFormWrapper
      backgroundColor={schemaItem.backgroundColor}
      borderColor={schemaItem.borderColor}
      borderRadius={schemaItem.borderRadius}
      borderWidth={schemaItem.borderWidth}
      boxShadow={schemaItem.boxShadow}
      className={`t--jsonformfield-${fieldClassName}`}
    >
      <FieldLabel
        label={schemaItem.label}
        labelStyle={schemaItem.labelStyle}
        labelTextColor={schemaItem.labelTextColor}
        labelTextSize={schemaItem.labelTextSize}
        tooltip={schemaItem.tooltip}
      />
      {fields}
      <StyledButton
        className="t--jsonformfield-array-add-btn"
        color={schemaItem.accentColor}
        disabled={schemaItem.isDisabled}
        onClick={schemaItem.isDisabled ? undefined : add}
        type="button"
      >
        <StyledIconWrapper>
          <Icon
            icon="add"
            iconSize={ACTION_ICON_SIZE}
            style={{ color: schemaItem.accentColor || Colors.GREEN }}
          />
        </StyledIconWrapper>
        <span className="t--text">Add New</span>
      </StyledButton>
    </StyledNestedFormWrapper>
  );
}

const MemoizedArrayField: FieldComponent = React.memo(ArrayField);
MemoizedArrayField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default MemoizedArrayField;
