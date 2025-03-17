import { Button, Flex } from "@appsmith/ads";
import React, { memo } from "react";

interface SuggestionButtonsProps {
  onApply: (suggestion: string) => void;
}

const suggestions = [
  {
    label: "Table",
    text: "Create a table",
  },
  {
    label: "Chart",
    text: "Create a chart",
  },
  {
    label: "List",
    text: "Create a list",
  },
  {
    label: "Form",
    text: "Create a form",
  },
];

export const SuggestionButtons = memo((props: SuggestionButtonsProps) => {
  const { onApply } = props;

  return (
    <Flex gap="spaces-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.label}
          kind="secondary"
          onClick={() => onApply(suggestion.text)}
        >
          {suggestion.label}
        </Button>
      ))}
    </Flex>
  );
});
