import React, { Fragment } from "react";
import styled from "styled-components";
import { DefaultValues } from "react-hook-form";
import { Text } from "@blueprintjs/core";

import Form from "./Form";
import { FIELD_MAP, ROOT_SCHEMA_KEY, Schema } from "../constants";
import { isEmpty } from "lodash";
import { TEXT_SIZES } from "constants/WidgetConstants";

type StyledContainerProps = {
  backgroundColor?: string;
};

export type FormBuilderComponentProps<TValues> = {
  backgroundColor?: string;
  fixedFooter: boolean;
  formData?: TValues;
  schema: Schema;
  scrollContents: boolean;
  title: string;
  updateFormValues: (values: TValues) => void;
  useFormDataValues: boolean;
};

const StyledContainer = styled.div<StyledContainerProps>`
  background: ${({ backgroundColor }) => backgroundColor || "#fff"};
  overflow-y: auto;
`;

const StyledZeroStateWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
`;

const StyledZeroTitle = styled(Text)`
  font-size: ${TEXT_SIZES.HEADING3};
  left: 50%;
  position: absolute;
  text-align: center;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
`;

function FormBuilderComponent<TValues>({
  backgroundColor,
  formData,
  schema,
  ...rest
}: FormBuilderComponentProps<TValues>) {
  const isSchemaEmpty = isEmpty(schema);
  const zeroState = (
    <StyledZeroStateWrapper>
      <StyledZeroTitle>
        Connect data or paste JSON to add items to this form.
      </StyledZeroTitle>
    </StyledZeroStateWrapper>
  );

  const renderRootField = () => {
    const rootSchemaItem = schema[ROOT_SCHEMA_KEY];
    const RootField = FIELD_MAP[rootSchemaItem.fieldType] || Fragment;

    return <RootField name="" schemaItem={rootSchemaItem} />;
  };

  return (
    <StyledContainer backgroundColor={backgroundColor}>
      <Form
        {...rest}
        formData={formData as DefaultValues<TValues>}
        // eslint-disable-next-line no-console
        onSubmit={console.log}
        stretchBodyVertically={isSchemaEmpty}
      >
        {isEmpty(schema) ? zeroState : renderRootField()}
      </Form>
    </StyledContainer>
  );
}

export default FormBuilderComponent;
