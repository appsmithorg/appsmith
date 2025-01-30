import type { PropsWithChildren } from "react";
import React, { Fragment } from "react";
import styled from "styled-components";
import { Text } from "@blueprintjs/core";

import Form from "./Form";
import type { BoxShadow } from "components/designSystems/appsmith/WidgetStyleContainer";
import WidgetStyleContainer from "components/designSystems/appsmith/WidgetStyleContainer";
import type { Color } from "constants/Colors";
import type { Schema } from "../constants";
import { FIELD_MAP, MAX_ALLOWED_FIELDS, ROOT_SCHEMA_KEY } from "../constants";
import { FormContextProvider } from "../FormContext";
import { isEmpty, pick } from "lodash";
import type { RenderMode } from "constants/WidgetConstants";
import { RenderModes, TEXT_SIZES } from "constants/WidgetConstants";
import type { Action, JSONFormWidgetState } from "../widget";
import type { ButtonStyleProps } from "widgets/ButtonWidget/component";
import { ConnectDataOverlay } from "widgets/ConnectDataOverlay";
import {
  JSON_FORM_CONNECT_BUTTON_TEXT,
  JSON_FORM_CONNECT_OVERLAY_TEXT,
} from "../constants/messages";
import { createMessage } from "ee/constants/messages";

interface StyledContainerProps {
  backgroundColor?: string;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface JSONFormComponentProps<TValues = any> {
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
  fixMessageHeight: boolean;
  isWidgetMounting: boolean;
  isSubmitting: boolean;
  onConnectData: () => void;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateWidgetMetaProperty: (propertyName: string, propertyValue: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateWidgetProperty: (propertyName: string, propertyValue: any) => void;
  widgetId: string;
  showConnectDataOverlay?: boolean;
  maxAllowedFields?: number;
}

const StyledContainer = styled(WidgetStyleContainer)<StyledContainerProps>`
  background: ${({ backgroundColor }) => backgroundColor || "#fff"};
  overflow-y: auto;
`;

const MessageStateWrapper = styled.div<{ $fixHeight: boolean }>`
  align-items: center;
  display: flex;
  ${(props) => (props.$fixHeight ? "height: 303px" : "height: 100%")};
  justify-content: center;
`;

type MessageProps = PropsWithChildren<{
  $fixHeight: boolean;
}>;

const Message = styled(Text)<MessageProps>`
  font-size: ${TEXT_SIZES.HEADING3};
  text-align: center;
  width: 100%;
  left: 50%;
  ${(props) =>
    !props.$fixHeight
      ? `position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  `
      : ""}
`;

function InfoMessage({
  children,
  fixHeight,
}: {
  children: React.ReactNode;
  fixHeight: boolean;
}) {
  return (
    <MessageStateWrapper $fixHeight={fixHeight}>
      <Message $fixHeight={fixHeight}>{children}</Message>
    </MessageStateWrapper>
  );
}

function JSONFormComponent<TValues>(
  {
    backgroundColor,
    executeAction,
    fieldLimitExceeded,
    fixMessageHeight,
    getFormData,
    isSubmitting,
    isWidgetMounting,
    onConnectData,
    onFormValidityUpdate,
    registerResetObserver,
    renderMode,
    resetButtonLabel,
    schema,
    setMetaInternalFieldState,
    showConnectDataOverlay,
    submitButtonLabel,
    unregisterResetObserver,
    updateFormData,
    updateWidgetMetaProperty,
    updateWidgetProperty,
    ...rest
  }: JSONFormComponentProps<TValues>,
  ref:
    | ((instance: HTMLDivElement | null) => void)
    | React.MutableRefObject<HTMLDivElement | null>
    | null,
) {
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
    const RootField = FIELD_MAP[rootSchemaItem?.fieldType] || Fragment;
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
        <InfoMessage fixHeight={fixMessageHeight}>
          Source data exceeds {rest.maxAllowedFields || MAX_ALLOWED_FIELDS}{" "}
          fields. &nbsp;
          {renderMode === RenderModes.PAGE
            ? "Please contact your developer for more information"
            : "Please update the source data."}
        </InfoMessage>
      );
    }

    if (showConnectDataOverlay && isSchemaEmpty) {
      return (
        <div style={{ height: "200px" }}>
          <ConnectDataOverlay
            btnText={createMessage(JSON_FORM_CONNECT_BUTTON_TEXT)}
            message={createMessage(JSON_FORM_CONNECT_OVERLAY_TEXT)}
            onConnectData={onConnectData}
          />
        </div>
      );
    }

    return renderRootField();
  })();

  const hideFooter = fieldLimitExceeded && !showConnectDataOverlay;

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
          ref={ref}
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

export default React.memo(React.forwardRef(JSONFormComponent));
