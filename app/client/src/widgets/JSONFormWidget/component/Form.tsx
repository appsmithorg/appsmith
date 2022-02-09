import equal from "fast-deep-equal/es6";
import React, { PropsWithChildren, useRef } from "react";
import styled from "styled-components";
import { cloneDeep, debounce, isEmpty } from "lodash";
import { FormProvider, useForm } from "react-hook-form";
import { Text } from "@blueprintjs/core";

import {
  BaseButton as Button,
  ButtonStyleProps,
} from "widgets/ButtonWidget/component";
import { FIELD_PADDING_X } from "./styleConstants";
import { ROOT_SCHEMA_KEY, Schema } from "../constants";
import { TEXT_SIZES } from "constants/WidgetConstants";
import { schemaItemDefaultValue } from "../helper";

export type FormProps<TValues = any> = PropsWithChildren<{
  disabledWhenInvalid?: boolean;
  fixedFooter: boolean;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  resetButtonStyles: ButtonStyleProps;
  schema: Schema;
  scrollContents: boolean;
  showReset: boolean;
  stretchBodyVertically: boolean;
  submitButtonStyles: ButtonStyleProps;
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

function Form<TValues = any>({
  children,
  disabledWhenInvalid,
  fixedFooter,
  onSubmit,
  resetButtonStyles,
  schema,
  scrollContents,
  showReset,
  stretchBodyVertically,
  submitButtonStyles,
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
    if (schema[ROOT_SCHEMA_KEY]) {
      const defaultValues = schemaItemDefaultValue(schema[ROOT_SCHEMA_KEY]);

      debouncedUpdateFormData(defaultValues as TValues);
    }

    const subscription = watch((values) => {
      if (!equal(valuesRef.current, values)) {
        const clonedValue = cloneDeep(values);
        valuesRef.current = clonedValue;
        debouncedUpdateFormData(clonedValue as TValues);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const onReset = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault();
    const defaultValues = schemaItemDefaultValue(schema[ROOT_SCHEMA_KEY]);

    if (typeof defaultValues === "object") {
      reset(defaultValues);
    }
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
              {...resetButtonStyles}
              onClick={onReset}
              text="Reset"
              type="reset"
            />
          )}
          <Button
            {...submitButtonStyles}
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
