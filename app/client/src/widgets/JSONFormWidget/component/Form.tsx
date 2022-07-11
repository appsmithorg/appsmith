import equal from "fast-deep-equal/es6";
import React, { PropsWithChildren, useEffect, useRef } from "react";
import styled from "styled-components";
import { debounce, isEmpty } from "lodash";
import { FormProvider, useForm } from "react-hook-form";
import { Text } from "@blueprintjs/core";
import { klona } from "klona";

import useFixedFooter from "./useFixedFooter";
import {
  BaseButton as Button,
  ButtonStyleProps,
} from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import { FORM_PADDING_Y, FORM_PADDING_X } from "./styleConstants";
import { ROOT_SCHEMA_KEY, Schema } from "../constants";
import { convertSchemaItemToFormData, schemaItemDefaultValue } from "../helper";
import { TEXT_SIZES } from "constants/WidgetConstants";

export type FormProps<TValues = any> = PropsWithChildren<{
  backgroundColor?: string;
  disabledWhenInvalid?: boolean;
  fixedFooter: boolean;
  getFormData: () => TValues;
  hideFooter: boolean;
  isSubmitting: boolean;
  isWidgetMounting: boolean;
  onFormValidityUpdate: (isValid: boolean) => void;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  registerResetObserver: (callback: () => void) => void;
  resetButtonLabel: string;
  resetButtonStyles: ButtonStyleProps;
  schema?: Schema;
  scrollContents: boolean;
  showReset: boolean;
  stretchBodyVertically: boolean;
  submitButtonLabel: string;
  submitButtonStyles: ButtonStyleProps;
  title: string;
  unregisterResetObserver: () => void;
  updateFormData: (values: TValues, skipConversion?: boolean) => void;
}>;

type StyledFormProps = {
  fixedFooter: boolean;
  scrollContents: boolean;
};

type StyledFormBodyProps = {
  stretchBodyVertically: boolean;
};

type StyledFooterProps = {
  fixedFooter: boolean;
  backgroundColor?: string;
};

const BUTTON_WIDTH = 110;
const FOOTER_BUTTON_GAP = 10;
const FOOTER_DEFAULT_BG_COLOR = "#fff";
const FOOTER_PADDING_TOP = FORM_PADDING_Y;
const TITLE_MARGIN_BOTTOM = 16;
const FOOTER_SCROLL_ACTIVE_CLASS_NAME = "scroll-active";

const StyledFormFooter = styled.div<StyledFooterProps>`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || FOOTER_DEFAULT_BG_COLOR};
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: ${FORM_PADDING_Y}px ${FORM_PADDING_X}px;
  padding-top: ${FOOTER_PADDING_TOP}px;
  position: ${({ fixedFooter }) => fixedFooter && "sticky"};
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
  justify-content: ${({ fixedFooter }) => fixedFooter && "space-between"};
  overflow-y: ${({ scrollContents }) => (scrollContents ? "auto" : "hidden")};
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
  padding: ${FORM_PADDING_Y}px ${FORM_PADDING_X}px;
`;

const StyledResetButtonWrapper = styled.div``;

const DEBOUNCE_TIMEOUT = 200;

const RESET_OPTIONS = {
  keepErrors: true,
};

function Form<TValues = any>({
  backgroundColor,
  children,
  disabledWhenInvalid,
  fixedFooter,
  getFormData,
  hideFooter,
  isSubmitting,
  isWidgetMounting,
  onFormValidityUpdate,
  onSubmit,
  registerResetObserver,
  resetButtonLabel,
  resetButtonStyles,
  schema,
  scrollContents,
  showReset,
  stretchBodyVertically,
  submitButtonLabel,
  submitButtonStyles,
  title,
  unregisterResetObserver,
  updateFormData,
}: FormProps<TValues>) {
  const valuesRef = useRef({});
  const methods = useForm();
  const { formState, reset, watch } = methods;
  const { errors } = formState;
  const isFormInValid = !isEmpty(errors);

  const { bodyRef, footerRef } = useFixedFooter<
    HTMLFormElement,
    HTMLDivElement
  >({
    activeClassName: FOOTER_SCROLL_ACTIVE_CLASS_NAME,
    fixedFooter,
  });

  const onReset = (
    schema?: Schema,
    event?: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    event?.preventDefault?.();

    const defaultValues =
      schema && schema[ROOT_SCHEMA_KEY]
        ? schemaItemDefaultValue(schema[ROOT_SCHEMA_KEY], "identifier")
        : {};

    if (typeof defaultValues === "object") {
      reset(defaultValues, RESET_OPTIONS);
    }
  };

  useEffect(() => {
    const debouncedUpdateFormData = debounce(updateFormData, DEBOUNCE_TIMEOUT);
    const formData = getFormData();

    /**
     * Hydration logic -
     * If on mounting if it is mounted for the very first time then the formData
     * would be empty and the formData has to be hydrated with the default value.
     *
     * When the widget is dragged, the Form component is remounted but we want
     * to preserve the values entered in the form before it was dragged and repositioned.
     * In this case the formData (meta) is used to hydrate the form.
     */
    if (schema && schema[ROOT_SCHEMA_KEY]) {
      /**
       * There are 3 ways this effect can get called
       * 1. New widget drop / first page load
       * 2. Widget drag
       * 3. Widget in modal
       *
       * For case 1 the formData is always empty
       * For case 2 the formData can have some data and hence would be used to
       *  hydrated in the else condition (this component would mount but the widget won't so
       *  isWidgetMounting would be false)
       * For case 3 the formData would be always be present even if the modal is open or
       *  closed. When the modal opens the widget would be mounted and we need to know if
       *  we need to use the formData or the defaultData to hydrate the form fields as during a
       *  drag operation this Form component also remounts but the widget doesn't. So the isWidgetMounting
       *  flag is used to check if the widget is mounting or not (modal) thus indicating if this needs
       *  to be hydrated with the default value rather than the formData.
       */
      if (isEmpty(formData) || isWidgetMounting) {
        const defaultValues = schemaItemDefaultValue(
          schema[ROOT_SCHEMA_KEY],
          "accessor",
        );
        updateFormData(defaultValues as TValues, true);
      } else {
        // When the accessor changes, this formData needs to be converted to have
        // identifier as keys
        const convertedFormData = convertSchemaItemToFormData(
          schema[ROOT_SCHEMA_KEY],
          formData,
          { fromId: "accessor", toId: "identifier" },
        );
        /**
         * This setTimeout is because of the setTimeout present in
         * FieldComponent defaultValue effect. First all the setValue
         * in the field effect is run then this reset function is run.
         * The reason to these in setTimeout with 0 is to circumvent
         * race condition in ReactHookForm.
         */
        setTimeout(() => {
          reset(convertedFormData, RESET_OPTIONS);
        }, 0);
      }
    }

    const subscription = watch((values) => {
      if (!equal(valuesRef.current, values)) {
        const clonedValue = klona(values);
        valuesRef.current = clonedValue;
        debouncedUpdateFormData(clonedValue as TValues);
      }
    });

    registerResetObserver(onReset);

    return () => {
      subscription.unsubscribe();
      unregisterResetObserver();
    };
  }, []);

  useEffect(() => {
    if (!scrollContents && bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0 });
    }
  }, [scrollContents]);

  useEffect(() => {
    onFormValidityUpdate(!isFormInValid);
  }, [onFormValidityUpdate, isFormInValid]);

  return (
    <FormProvider {...methods}>
      <StyledForm
        fixedFooter={fixedFooter}
        ref={bodyRef}
        scrollContents={scrollContents}
      >
        <StyledFormBody
          className="t--jsonform-body"
          stretchBodyVertically={stretchBodyVertically}
        >
          <StyledTitle>{title}</StyledTitle>
          {children}
        </StyledFormBody>
        {!hideFooter && (
          <StyledFormFooter
            backgroundColor={backgroundColor}
            className="t--jsonform-footer"
            fixedFooter={fixedFooter}
            ref={footerRef}
          >
            {showReset && (
              <StyledResetButtonWrapper>
                <Button
                  {...resetButtonStyles}
                  onClick={(e) => onReset(schema, e)}
                  text={resetButtonLabel}
                  type="reset"
                />
              </StyledResetButtonWrapper>
            )}
            <Button
              {...submitButtonStyles}
              disabled={disabledWhenInvalid && isFormInValid}
              loading={isSubmitting}
              onClick={onSubmit}
              text={submitButtonLabel}
              type="submit"
            />
          </StyledFormFooter>
        )}
      </StyledForm>
    </FormProvider>
  );
}

export default Form;
