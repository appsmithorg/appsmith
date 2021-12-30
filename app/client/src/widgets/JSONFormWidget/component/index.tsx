import React, { Fragment } from "react";
import styled from "styled-components";
import { Text } from "@blueprintjs/core";

import Form from "./Form";
import WidgetStyleContainer, {
  BoxShadow,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import { Color } from "constants/Colors";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { FIELD_MAP, ROOT_SCHEMA_KEY, Schema } from "../constants";
import { FormContextProvider } from "../FormContext";
import { isEmpty, pick } from "lodash";
import { RenderMode, TEXT_SIZES } from "constants/WidgetConstants";

type StyledContainerProps = {
  backgroundColor?: string;
};

export type JSONFormComponentProps<TValues> = {
  backgroundColor?: string;
  borderColor?: Color;
  borderRadius?: number;
  borderWidth?: number;
  boxShadow?: BoxShadow;
  boxShadowColor?: string;
  disabledWhenInvalid?: boolean;
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  fieldState: Record<string, any>;
  fixedFooter: boolean;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  renderMode: RenderMode;
  schema: Schema;
  scrollContents: boolean;
  showReset: boolean;
  sourceData?: TValues;
  title: string;
  updateFormData: (values: TValues) => void;
  updateWidgetMetaProperty: (propertyName: string, propertyValue: any) => void;
  updateWidgetProperty: (propertyName: string, propertyValue: any) => void;
  widgetId: string;
};

const StyledContainer = styled(WidgetStyleContainer)<StyledContainerProps>`
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

function JSONFormComponent<TValues>({
  executeAction,
  fieldState,
  renderMode,
  schema,
  sourceData,
  updateWidgetMetaProperty,
  updateWidgetProperty,
  ...rest
}: JSONFormComponentProps<TValues>) {
  const isSchemaEmpty = isEmpty(schema);
  const styleProps = pick(rest, [
    "backgroundColor",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "boxShadow",
    "boxShadowColor",
    "widgetId",
  ]);

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
        isRootField
        name=""
        propertyPath={propertyPath}
        schemaItem={rootSchemaItem}
      />
    );
  };

  return (
    <FormContextProvider
      executeAction={executeAction}
      fieldState={fieldState}
      renderMode={renderMode}
      updateWidgetMetaProperty={updateWidgetMetaProperty}
      updateWidgetProperty={updateWidgetProperty}
    >
      <StyledContainer {...styleProps}>
        <Form
          {...rest}
          schema={schema}
          sourceData={sourceData}
          stretchBodyVertically={isSchemaEmpty}
        >
          {isEmpty(schema) ? zeroState : renderRootField()}
        </Form>
      </StyledContainer>
    </FormContextProvider>
  );
}

export default JSONFormComponent;
