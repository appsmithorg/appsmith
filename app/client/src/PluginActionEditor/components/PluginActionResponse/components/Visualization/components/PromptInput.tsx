import { Button, Input } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const PromptForm = styled.form`
  display: flex;
  flex: 1;
  gap: var(--ads-v2-spaces-3);
`;

export const PromptInput = (props: PromptInputProps) => {
  const { isDisabled, isLoading, onChange, onSubmit, value } = props;

  return (
    <PromptForm
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        isDisabled={isDisabled}
        onChange={onChange}
        placeholder="Describe the data visualisation you want"
        size="md"
        value={value}
      />
      <Button
        isDisabled={isDisabled || !value}
        isIconButton
        isLoading={isLoading}
        kind="primary"
        size="md"
        startIcon="arrow-up-line"
        type="submit"
      />
    </PromptForm>
  );
};
