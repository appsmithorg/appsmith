import React, { Fragment } from "react";
import styled from "styled-components";
import { Text } from "@blueprintjs/core";

import Form from "./Form";
import WidgetStyleContainer, {
  BoxShadow,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import { Color } from "constants/Colors";
import {
  FIELD_MAP,
  MAX_ALLOWED_FIELDS,
  ROOT_SCHEMA_KEY,
  Schema,
} from "../constants";
import { FormContextProvider } from "../FormContext";
import { isEmpty, pick } from "lodash";
import { RenderMode, RenderModes, TEXT_SIZES } from "constants/WidgetConstants";
import { Action, JSONFormWidgetState } from "../widget";
import { ButtonStyleProps } from "widgets/ButtonWidget/component";

type StyledContainerProps = {
  backgroundColor?: string;
};

export type JSONFormComponentProps<TValues = any> = {
  backgroundColor?: string;
  borderColor?: Color;
  borderRadius?: number;
  borderWidth?: number;
  boxShadow?: BoxShadow;
  boxShadowColor?: string;
  disabledWhenInvalid?: boolean;
  executeAction: (action: Action) => void;
  fieldLimitExceeded: boolean;
  fixedFooter: boolean;
  getFormData: () => TValues;
  isWidgetMounting: boolean;
  isSubmitting: boolean;
  onFormValidityUpdate: (isValid: boolean) => void;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  registerResetObserver: (callback: () => void) => void;
  renderMode: RenderMode;
  resetButtonLabel: string;
  resetButtonStyles: ButtonStyleProps;
  schema: Schema;
  scrollContents: boolean;
  submitButtonLabel: string;
  unregisterResetObserver: () => void;
  setMetaInternalFieldState: (
    cb: (prevState: JSONFormWidgetState) => JSONFormWidgetState,
  ) => void;
  showReset: boolean;
  submitButtonStyles: ButtonStyleProps;
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

const MessageStateWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
`;

const Message = styled(Text)`
  font-size: ${TEXT_SIZES.HEADING3};
  left: 50%;
  position: absolute;
  text-align: center;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
`;

function InfoMessage({ children }: { children: React.ReactNode }) {
  return (
    <MessageStateWrapper>
      <Message>{children}</Message>
    </MessageStateWrapper>
  );
}

function JSONFormComponent<TValues>({
  backgroundColor,
  executeAction,
  fieldLimitExceeded,
  getFormData,
  isSubmitting,
  isWidgetMounting,
  onFormValidityUpdate,
  registerResetObserver,
  renderMode,
  resetButtonLabel,
  schema,
  setMetaInternalFieldState,
  submitButtonLabel,
  unregisterResetObserver,
  updateFormData,
  updateWidgetMetaProperty,
  updateWidgetProperty,
  ...rest
}: JSONFormComponentProps<TValues>) {
  const isSchemaEmpty = isEmpty(schema);
  const styleProps = pick(rest, [
    "borderColor",
    "borderWidth",
    "borderRadius",
    "boxShadow",
    "boxShadowColor",
    "widgetId",
  ]);

  const renderRootField = () => {
    const rootSchemaItem = schema[ROOT_SCHEMA_KEY];
    const RootField = FIELD_MAP[rootSchemaItem.fieldType] || Fragment;
    const propertyPath = `schema.${ROOT_SCHEMA_KEY}`;

    return (
      <RootField
        fieldClassName="root"
        isRootField
        name=""
        propertyPath={propertyPath}
        schemaItem={rootSchemaItem}
      />
    );
  };

  const renderComponent = (() => {
    if (fieldLimitExceeded) {
      return (
        <InfoMessage>
          Source data exceeds {MAX_ALLOWED_FIELDS} fields.&nbsp;
          {renderMode === RenderModes.PAGE
            ? "Please contact your developer for more information"
            : "Please update the source data."}
        </InfoMessage>
      );
    }
    if (isSchemaEmpty) {
      return (
        <InfoMessage>
          Connect data or paste JSON to add items to this form.
        </InfoMessage>
      );
    }

    return renderRootField();
  })();

  const hideFooter = fieldLimitExceeded || isSchemaEmpty;

  return (
    <FormContextProvider
      executeAction={executeAction}
      renderMode={renderMode}
      setMetaInternalFieldState={setMetaInternalFieldState}
      updateFormData={updateFormData}
      updateWidgetMetaProperty={updateWidgetMetaProperty}
      updateWidgetProperty={updateWidgetProperty}
    >
      <StyledContainer backgroundColor={backgroundColor} {...styleProps}>
        <Form
          backgroundColor={backgroundColor}
          disabledWhenInvalid={rest.disabledWhenInvalid}
          fixedFooter={rest.fixedFooter}
          getFormData={getFormData}
          hideFooter={hideFooter}
          isSubmitting={isSubmitting}
          isWidgetMounting={isWidgetMounting}
          onFormValidityUpdate={onFormValidityUpdate}
          onSubmit={rest.onSubmit}
          registerResetObserver={registerResetObserver}
          resetButtonLabel={resetButtonLabel}
          resetButtonStyles={rest.resetButtonStyles}
          schema={schema}
          scrollContents={rest.scrollContents}
          showReset={rest.showReset}
          stretchBodyVertically={isSchemaEmpty}
          submitButtonLabel={submitButtonLabel}
          submitButtonStyles={rest.submitButtonStyles}
          title={rest.title}
          unregisterResetObserver={unregisterResetObserver}
          updateFormData={updateFormData}
        >
          {renderComponent}
        </Form>
      </StyledContainer>
    </FormContextProvider>
  );
}

export default React.memo(JSONFormComponent);
