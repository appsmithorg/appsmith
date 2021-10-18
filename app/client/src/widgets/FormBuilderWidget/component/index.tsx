import React, { Fragment } from "react";
import styled from "styled-components";
import { DefaultValues } from "react-hook-form";

import Form from "./Form";
import { FIELD_MAP, Schema } from "../constants";
import { isEmpty } from "lodash";

type StyledContainerProps = {
  backgroundColor?: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FormBuilderComponentProps<TValues> = {
  backgroundColor?: string;
  inputData: TValues;
  schema: Schema;
};

const StyledContainer = styled.div<StyledContainerProps>`
  background: ${({ backgroundColor }) => backgroundColor};
  overflow-y: auto;
`;

function FormBuilderComponent<TValues>({
  backgroundColor,
  inputData,
  schema,
}: FormBuilderComponentProps<TValues>) {
  if (isEmpty(schema)) return null;

  const rootSchemaItem = schema[0];

  const RootField = FIELD_MAP[rootSchemaItem.fieldType] || Fragment;

  return (
    <StyledContainer backgroundColor={backgroundColor}>
      <Form
        defaultValues={inputData as DefaultValues<TValues>}
        // eslint-disable-next-line no-console
        onSubmit={console.log}
      >
        <RootField name="" schemaItem={rootSchemaItem} />
      </Form>
    </StyledContainer>
  );
}

export default FormBuilderComponent;
