import React, { PropsWithChildren, useEffect } from "react";
import styled from "styled-components";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  DefaultValues,
} from "react-hook-form";
import { Text } from "@blueprintjs/core";

import { BaseButton as Button } from "widgets/ButtonWidget/component";
import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { FIELD_PADDING_X } from "../constants";
import { TEXT_SIZES } from "constants/WidgetConstants";

type FormProps<TValues = any> = PropsWithChildren<{
  fixedFooter: boolean;
  formData: DefaultValues<TValues>;
  onSubmit: SubmitHandler<TValues>;
  scrollContents: boolean;
  title: string;
  updateFormValues: (values: TValues) => void;
  useFormDataValues: boolean;
}>;

type StyledFormProps = {
  fixedFooter: boolean;
  scrollContents: boolean;
};

const FOOTER_BUTTON_GAP = 10;
const BUTTON_WIDTH = 110;
const FORM_FOOTER_PADDING_TOP = 10;
const TITLE_MARGIN_BOTTOM = 16;

const StyledFormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: ${FORM_FOOTER_PADDING_TOP}px;

  && > button {
    width: ${BUTTON_WIDTH}px;
  }

  & > button:first-of-type {
    margin-right: ${FOOTER_BUTTON_GAP}px;
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

export const StyledTitle = styled(Text)`
  font-weight: bold;
  font-size: ${TEXT_SIZES.HEADING1};
  word-break: break-word;
  margin-bottom: ${TITLE_MARGIN_BOTTOM}px;
`;

function Form<TValues = any>({
  children,
  fixedFooter,
  formData,
  onSubmit,
  scrollContents,
  title,
  updateFormValues,
  useFormDataValues,
}: FormProps<TValues>) {
  const methods = useForm();
  const { reset, watch } = methods;

  useEffect(() => {
    // If the user chooses to use the formData's values as default value (useful when
    // Table.selectedRow is set as the formData)
    if (useFormDataValues) {
      reset(formData);
    }
  }, [formData, useFormDataValues]);

  React.useEffect(() => {
    // TODO: find a better way if possible to set the form values
    // The problem here is that it's going to re-render the whole form, thus beating
    // the whole point of subscription
    const subscription = watch((values) => {
      // eslint-disable-next-line
      console.log("FORM VALUES", values);
      updateFormValues(values as TValues);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <FormProvider {...methods}>
      <StyledForm
        fixedFooter={fixedFooter}
        onSubmit={methods.handleSubmit(onSubmit)}
        scrollContents={scrollContents}
      >
        <div>
          <StyledTitle>{title}</StyledTitle>
          {children}
        </div>
        <StyledFormFooter>
          <Button
            buttonColor={Colors.GREEN}
            buttonVariant={ButtonVariantTypes.SECONDARY}
            text="Reset"
            type="reset"
          />
          <Button
            buttonColor={Colors.GREEN}
            buttonVariant={ButtonVariantTypes.PRIMARY}
            text="Submit"
            type="submit"
          />
        </StyledFormFooter>
      </StyledForm>
    </FormProvider>
  );
}

export default Form;
