import equal from "fast-deep-equal/es6";
import React, { PropsWithChildren, useEffect, useRef } from "react";
import styled from "styled-components";
import { cloneDeep, debounce, isEmpty } from "lodash";
import { FormProvider, useForm } from "react-hook-form";
import { Text } from "@blueprintjs/core";

import {
  BaseButton as Button,
  ButtonStyleProps,
} from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import { FORM_PADDING_Y, FORM_PADDING_X } from "./styleConstants";
import { ROOT_SCHEMA_KEY, Schema } from "../constants";
import { schemaItemDefaultValue } from "../helper";
import { TEXT_SIZES } from "constants/WidgetConstants";

export type FormProps<TValues = any> = PropsWithChildren<{
  backgroundColor?: string;
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
  backgroundColor?: string;
};

const BUTTON_HEIGHT = 30;
const BUTTON_WIDTH = 110;
const FOOTER_BUTTON_GAP = 10;
const FOOTER_DEFAULT_BG_COLOR = "#fff";
const FOOTER_PADDING_TOP = FORM_PADDING_Y;
const TITLE_MARGIN_BOTTOM = 16;
const FOOTER_SCROLL_ACTIVE_CLASS_NAME = "scroll-active";

const StyleFormFooterPlaceholder = styled.div`
  min-height: ${BUTTON_HEIGHT + FOOTER_PADDING_TOP}px;
`;

const StyledFormFooter = styled.div<StyledFooterProps>`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || FOOTER_DEFAULT_BG_COLOR};
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding-bottom: ${({ fixedFooter }) => (fixedFooter ? FORM_PADDING_Y : 0)}px;
  padding-right: ${({ fixedFooter }) =>
    fixedFooter ? FORM_PADDING_X + 6 : 0}px;
  padding-top: ${FOOTER_PADDING_TOP}px;
  position: ${({ fixedFooter }) => fixedFooter && "fixed"};
  right: 0;
  width: 100%;

  &.${FOOTER_SCROLL_ACTIVE_CLASS_NAME} {
    box-shadow: 0px -10px 10px -10px ${Colors.GREY_3};
    border-top: 1px solid ${Colors.GREY_3};
  }

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
  padding: ${FORM_PADDING_Y}px ${FORM_PADDING_X}px;
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

const scrolledToBottom = (element: HTMLElement) => {
  const { clientHeight, scrollHeight, scrollTop } = element;
  return scrollHeight - scrollTop === clientHeight;
};

function Form<TValues = any>({
  backgroundColor,
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
  const formRef = useRef<HTMLFormElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef({});
  const methods = useForm();
  const { formState, reset, watch } = methods;
  const { errors } = formState;
  const isFormInValid = !isEmpty(errors);

  useEffect(() => {
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

  useEffect(() => {
    if (
      fixedFooter &&
      footerRef.current &&
      formRef.current &&
      !scrolledToBottom(formRef.current)
    ) {
      footerRef.current.classList.add(FOOTER_SCROLL_ACTIVE_CLASS_NAME);
    }
  }, [fixedFooter]);

  const onScroll = (event: React.UIEvent<HTMLFormElement, UIEvent>) => {
    if (fixedFooter && footerRef.current) {
      scrolledToBottom(event.currentTarget)
        ? footerRef.current.classList.remove(FOOTER_SCROLL_ACTIVE_CLASS_NAME)
        : footerRef.current.classList.add(FOOTER_SCROLL_ACTIVE_CLASS_NAME);
    }
  };

  return (
    <FormProvider {...methods}>
      <StyledForm
        onScroll={onScroll}
        ref={formRef}
        scrollContents={scrollContents}
      >
        <StyledFormBody stretchBodyVertically={stretchBodyVertically}>
          <StyledTitle>{title}</StyledTitle>
          {children}
        </StyledFormBody>
        {/* {This placeholder div makes sure there is ample amount of space
          at the bottom for the buttons to occupy as in fixed mode the div looses its
          spacing } */}
        {fixedFooter && <StyleFormFooterPlaceholder />}
        <StyledFormFooter
          backgroundColor={backgroundColor}
          fixedFooter={fixedFooter}
          ref={footerRef}
        >
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
