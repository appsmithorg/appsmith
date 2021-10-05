import React from "react";
import styled from "styled-components";

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
`;

function FormBuilderComponent<TValues>({
  backgroundColor,
  inputData,
  schema,
}: FormBuilderComponentProps<TValues>) {
  if (isEmpty(schema)) return null;

  const rootSchemaObject = schema.__root__;

  const RootField = FIELD_MAP[rootSchemaObject.fieldType]?.fieldComponent;

  return (
    <StyledContainer backgroundColor={backgroundColor}>
      {/* eslint-disable-next-line */}
      <Form defaultValues={inputData} onSubmit={console.log}>
        <RootField schemaObject={rootSchemaObject} />
      </Form>
    </StyledContainer>
  );
}

export default FormBuilderComponent;
