import React, { Fragment } from "react";
import styled from "styled-components";
import { DefaultValues } from "react-hook-form";
import { Text } from "@blueprintjs/core";

import Form from "./Form";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { FIELD_MAP, ROOT_SCHEMA_KEY, Schema } from "../constants";
import { isEmpty } from "lodash";
import { RenderMode, TEXT_SIZES } from "constants/WidgetConstants";
import { FormContextProvider } from "../FormContext";

type StyledContainerProps = {
  backgroundColor?: string;
};

export type FormBuilderComponentProps<TValues> = {
  backgroundColor?: string;
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  fixedFooter: boolean;
  sourceData?: TValues;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  renderMode: RenderMode;
  schema: Schema;
  scrollContents: boolean;
  showReset: boolean;
  title: string;
  updateFormValues: (values: TValues) => void;
  updateWidgetProperty: (propertyName: string, propertyValue: any) => void;
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
  executeAction,
  renderMode,
  schema,
  sourceData,
  updateWidgetProperty,
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
    const propertyPath = `schema.${ROOT_SCHEMA_KEY}`;

    return (
      <RootField
        name=""
        propertyPath={propertyPath}
        schemaItem={rootSchemaItem}
      />
    );
  };

  return (
    <FormContextProvider
      executeAction={executeAction}
      renderMode={renderMode}
      updateWidgetProperty={updateWidgetProperty}
    >
      <StyledContainer backgroundColor={backgroundColor}>
        <Form
          {...rest}
          sourceData={sourceData}
          stretchBodyVertically={isSchemaEmpty}
        >
          {isEmpty(schema) ? zeroState : renderRootField()}
        </Form>
      </StyledContainer>
    </FormContextProvider>
  );
}

export default FormBuilderComponent;
