import React from "react";
import styled from "styled-components";

import Form from "./Form";
import { FIELD_MAP, Schema } from "../constants";
import { isEmpty } from "lodash";

type StyledContainerProps = {
  backgroundColor?: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FormBuilderComponentProps = {
  backgroundColor?: string;
  schema: Schema;
};

const StyledContainer = styled.div<StyledContainerProps>`
  background: ${({ backgroundColor }) => backgroundColor};
`;

function FormBuilderComponent({
  backgroundColor,
  schema,
}: FormBuilderComponentProps) {
  if (isEmpty(schema)) return null;

  const rootSchema = schema.__root__;

  const RootField = FIELD_MAP[rootSchema.fieldType]?.fieldComponent;

  return (
    <StyledContainer backgroundColor={backgroundColor}>
      {/* eslint-disable-next-line */}
      <Form onSubmit={console.log}>
        <RootField schema={rootSchema.children} />
      </Form>
    </StyledContainer>
  );
}

export default FormBuilderComponent;
