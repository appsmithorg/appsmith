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
import { FORM_PADDING } from "./styleConstants";
import { ROOT_SCHEMA_KEY, Schema } from "../constants";
import { TEXT_SIZES } from "constants/WidgetConstants";
import { schemaItemDefaultValue } from "../helper";

export type FormProps<TValues = any> = PropsWithChildren<{
  disabledWhenInvalid?: boolean;
  fixedFooter: boolean;
  isSubmitting: boolean;
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
  scrollContents: boolean;
};

type StyledFormBodyProps = {
  stretchBodyVertically: boolean;
};

type StyledFooterProps = {
  fixedFooter: boolean;
};

const BUTTON_WIDTH = 110;
const BUTTON_HEIGHT = 30;
const FOOTER_BUTTON_GAP = 10;
const FORM_FOOTER_PADDING_TOP = 15;
const TITLE_MARGIN_BOTTOM = 16;

const StyleFormFooterPlaceholder = styled.div`
  height: ${BUTTON_HEIGHT + FORM_FOOTER_PADDING_TOP}px;
`;

const StyledFormFooter = styled.div<StyledFooterProps>`
  display: flex;
  justify-content: flex-end;
  padding-top: ${FORM_FOOTER_PADDING_TOP}px;
  position: ${({ fixedFooter }) => fixedFooter && "fixed"};
  bottom: ${({ fixedFooter }) => fixedFooter && FORM_PADDING}px;
  right: ${({ fixedFooter }) => fixedFooter && FORM_PADDING}px;

  && > button,
  && > div {
    width: ${BUTTON_WIDTH}px;
  }

  && > button,
  && > div {
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
  overflow-y: ${({ scrollContents }) => (scrollContents ? "auto" : "hidden")};
  padding: ${FORM_PADDING}px;
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

const StyledResetButtonWrapper = styled.div`
  background: #fff;
`;

function Form<TValues = any>({
  children,
  disabledWhenInvalid,
  fixedFooter,
  isSubmitting,
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
      <StyledForm scrollContents={scrollContents}>
        <StyledFormBody stretchBodyVertically={stretchBodyVertically}>
          <StyledTitle>{title}</StyledTitle>
          {children}
        </StyledFormBody>
        {/* {This placeholder div makes sure there is ample amount of space
          at the bottom for the buttons to occupy as in fixed mode the div looses its
          spacing } */}
        {fixedFooter && <StyleFormFooterPlaceholder />}
        <StyledFormFooter fixedFooter={fixedFooter}>
          {showReset && (
            <StyledResetButtonWrapper>
              <Button
                {...resetButtonStyles}
                onClick={onReset}
                text="Reset"
                type="reset"
              />
            </StyledResetButtonWrapper>
          )}
          <Button
            {...submitButtonStyles}
            disabled={disabledWhenInvalid && isFormInValid}
            loading={isSubmitting}
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
