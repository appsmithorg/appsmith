import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import styled from "styled-components";
import type { InputType } from "components/constants";
import { type InputTypes as DSInputType, Text } from "@appsmith/ads";
import {
  type WrappedFieldMetaProps,
  type WrappedFieldInputProps,
} from "redux-form";
import { Field } from "redux-form";
import { Input, Flex } from "@appsmith/ads";
import { GeneratePromptButton } from "ee/components/GeneratePromptButton";

export interface AiChatSystemInstructionsControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  subtitle?: string;
  disabled?: boolean;
  width?: string;
  dataType?: DSInputType;
  meta: Partial<WrappedFieldMetaProps>;
  input: Partial<WrappedFieldInputProps>;
}

const FieldWrapper = styled.div<{
  width: string;
}>`
  position: relative;
  width: ${(props) => (props?.width ? props.width : "")};
`;

function renderComponent(props: AiChatSystemInstructionsControlProps) {
  const { disabled, input, placeholderText } = props;

  const onGeneratedPrompt = (prompt: string) => {
    if (input && input.onChange) {
      input.onChange(prompt);
    }
  };

  return (
    <>
      <Flex
        gap="spaces-4"
        justifyContent="space-between"
        marginBottom="spaces-2"
      >
        <Text isBold kind="heading-s" renderAs="p">
          System Instructions
        </Text>

        <GeneratePromptButton
          existingPrompt={input.value}
          onSubmit={onGeneratedPrompt}
        />
      </Flex>
      <Input
        UNSAFE_height="200px"
        isDisabled={disabled || false}
        name={input?.name}
        onChange={input.onChange}
        placeholder={placeholderText}
        renderAs="textarea"
        size="md"
        value={input.value}
      />
    </>
  );
}

export class AiChatSystemInstructionsControl extends BaseControl<AiChatSystemInstructionsControlProps> {
  render() {
    const {
      configProperty,
      customStyles,
      disabled,
      label,
      placeholderText,
      propertyValue,
      subtitle,
      width,
    } = this.props;

    return (
      <FieldWrapper
        data-testid={configProperty}
        style={customStyles || {}}
        width={width || ""}
      >
        <Field
          asyncControl
          component={renderComponent}
          disabled={disabled || false}
          label={label}
          name={configProperty}
          placeholderText={placeholderText}
          subtitle={subtitle}
          value={propertyValue}
        />
      </FieldWrapper>
    );
  }

  getControlType(): ControlType {
    return "AI_CHAT_SYSTEM_INSTRUCTIONS";
  }
}
