import { Button, Flex, Input } from "@appsmith/ads";
import React from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export const PromptInput = (props: PromptInputProps) => {
  const { isDisabled, isLoading, onChange, onSubmit, value } = props;

  return (
    // We can't use a form here because editor already wrapped in a form
    <Flex flex="1" gap="spaces-3">
      <Input
        isDisabled={isDisabled}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit();
          }
        }}
        placeholder="Describe the data visualisation you want"
        size="md"
        value={value}
      />
      <Button
        isDisabled={isDisabled || !value}
        isIconButton
        isLoading={isLoading}
        kind="primary"
        onClick={onSubmit}
        size="md"
        startIcon="arrow-up-line"
      />
    </Flex>
  );
};
