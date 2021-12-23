import equal from "fast-deep-equal/es6";
import React, { PropsWithChildren, useRef } from "react";
import styled from "styled-components";
import { cloneDeep, isEmpty } from "lodash";
import { FormProvider, useForm } from "react-hook-form";
import { Text } from "@blueprintjs/core";

import { BaseButton as Button } from "widgets/ButtonWidget/component";
import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { TEXT_SIZES } from "constants/WidgetConstants";
import { FIELD_PADDING_X } from "./styleConstants";

export type FormProps<TValues = any> = PropsWithChildren<{
  disabledWhenInvalid?: boolean;
  fixedFooter: boolean;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  scrollContents: boolean;
  showReset: boolean;
  sourceData?: TValues;
  stretchBodyVertically: boolean;
  title: string;
  updateFormValues: (values: TValues) => void;
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
  scrollContents,
  showReset,
  sourceData,
  stretchBodyVertically,
  title,
  updateFormValues,
}: FormProps<TValues>) {
  const valuesRef = useRef({});
  const methods = useForm();
  const { formState, reset, watch } = methods;
  const { errors } = formState;
  const isFormInValid = !isEmpty(errors);

  React.useEffect(() => {
    // TODO: find a better way if possible to set the form values
    // The problem here is that it's going to re-render the whole form, thus beating
    // the whole point of subscription
    const subscription = watch((values) => {
      // eslint-disable-next-line
      console.log("FORM VALUES", values);
      // TODO: CHECK why this is getting triggered when other buttons are pressed in the canvas
      if (!equal(valuesRef.current, values)) {
        valuesRef.current = cloneDeep(values);
        updateFormValues(values as TValues);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const onReset = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault();

    reset(sourceData);
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
