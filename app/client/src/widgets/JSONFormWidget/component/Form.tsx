import equal from "fast-deep-equal/es6";
import React, { PropsWithChildren, useRef } from "react";
import styled from "styled-components";
import { cloneDeep, debounce, isEmpty, merge } from "lodash";
import { FormProvider, useForm } from "react-hook-form";
import { Text } from "@blueprintjs/core";

import { BaseButton as Button } from "widgets/ButtonWidget/component";
import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { FIELD_PADDING_X } from "./styleConstants";
import { ARRAY_ITEM_KEY, FieldType, Schema, SchemaItem } from "../constants";
import { TEXT_SIZES } from "constants/WidgetConstants";

export type FormProps<TValues = any> = PropsWithChildren<{
  disabledWhenInvalid?: boolean;
  fixedFooter: boolean;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  schema: Schema;
  scrollContents: boolean;
  showReset: boolean;
  sourceData?: TValues;
  stretchBodyVertically: boolean;
  title: string;
  updateFormData: (values: TValues) => void;
}>;

type StyledFormProps = {
  fixedFooter: boolean;
  scrollContents: boolean;
};

type StyledFormBodyProps = {
  stretchBodyVertically: boolean;
};

const BUTTON_WIDTH = 110;
const FOOTER_BUTTON_GAP = 10;
const FORM_FOOTER_PADDING_TOP = 10;
const TITLE_MARGIN_BOTTOM = 16;

const StyledFormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: ${FORM_FOOTER_PADDING_TOP}px;

  && > button {
    width: ${BUTTON_WIDTH}px;
  }

  & > button {
    margin-right: ${FOOTER_BUTTON_GAP}px;
  }

  & > button:last-of-type {
    margin-right: 0;
  }
`;

const StyledForm = styled.form<StyledFormProps>`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: ${({ fixedFooter }) => fixedFooter && "space-between"};
  overflow-y: ${({ scrollContents }) => (scrollContents ? "auto" : "hidden")};
  padding: ${FIELD_PADDING_X}px;
`;

const StyledTitle = styled(Text)`
  font-weight: bold;
  font-size: ${TEXT_SIZES.HEADING1};
  word-break: break-word;
  margin-bottom: ${TITLE_MARGIN_BOTTOM}px;
`;

const StyledFormBody = styled.div<StyledFormBodyProps>`
  height: ${({ stretchBodyVertically }) =>
    stretchBodyVertically ? "100%" : "auto"};
`;

const processObject = (schema: Schema) => {
  const obj: Record<string, any> = {};

  Object.values(schema).forEach((schemaItem) => {
    obj[schemaItem.name] = processSchemaItem(schemaItem);
  });

  return obj;
};

const processArray = (schema: Schema): any[] => {
  if (schema[ARRAY_ITEM_KEY]) {
    return [processSchemaItem(schema[ARRAY_ITEM_KEY])];
  }

  return [];
};

const processSchemaItem = (schemaItem: SchemaItem) => {
  if (schemaItem.fieldType === FieldType.OBJECT) {
    return processObject(schemaItem.children);
  }

  if (schemaItem.fieldType === FieldType.ARRAY) {
    const defaultArrayValue = processArray(schemaItem.children);

    /**
     * Reason for merge
     * - For an array type, the default value of individual fields underneath the array
     * are not present as array field handles whole default data coming from sourceData directly.
     * So the default value we get from processArray(schemaItem.children) will have some value only if
     * the default value of any field under the array is set explicitly by the user in the property pane.
     * Thus we merge both array level default value and any default value the underlying field holds
     * to get a complete defaultValue.
     */
    return merge(schemaItem.defaultValue, defaultArrayValue);
  }

  const { defaultValue } = schemaItem;
  return defaultValue;
};

const getDefaultValues = (schema: Schema) => {
  let defaultValues: any;
  Object.values(schema).forEach((schemaItem) => {
    defaultValues = processSchemaItem(schemaItem);
  });

  return defaultValues;
};

function Form<TValues = any>({
  children,
  disabledWhenInvalid,
  fixedFooter,
  onSubmit,
  schema,
  scrollContents,
  showReset,
  stretchBodyVertically,
  title,
  updateFormData,
}: FormProps<TValues>) {
  const valuesRef = useRef({});
  const methods = useForm();
  const { formState, reset, watch } = methods;
  const { errors } = formState;
  const isFormInValid = !isEmpty(errors);

  React.useEffect(() => {
    const debouncedUpdateFormData = debounce(updateFormData, 300);
    const defaultValues = getDefaultValues(schema);

    debouncedUpdateFormData(defaultValues as TValues);

    const subscription = watch((values) => {
      if (!equal(valuesRef.current, values)) {
        valuesRef.current = cloneDeep(values);
        debouncedUpdateFormData(values as TValues);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const onReset = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault();
    const defaultValues = getDefaultValues(schema);

    reset(defaultValues);
  };

  return (
    <FormProvider {...methods}>
      <StyledForm fixedFooter={fixedFooter} scrollContents={scrollContents}>
        <StyledFormBody stretchBodyVertically={stretchBodyVertically}>
          <StyledTitle>{title}</StyledTitle>
          {children}
        </StyledFormBody>
        <StyledFormFooter>
          {showReset && (
            <Button
              buttonColor={Colors.GREEN}
              buttonVariant={ButtonVariantTypes.SECONDARY}
              onClick={onReset}
              text="Reset"
              type="reset"
            />
          )}
          <Button
            buttonColor={Colors.GREEN}
            buttonVariant={ButtonVariantTypes.PRIMARY}
            disabled={disabledWhenInvalid && isFormInValid}
            onClick={onSubmit}
            text="Submit"
            type="submit"
          />
        </StyledFormFooter>
      </StyledForm>
    </FormProvider>
  );
}

export default Form;
