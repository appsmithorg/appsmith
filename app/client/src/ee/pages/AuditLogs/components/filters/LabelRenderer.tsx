import React from "react";
import { DropdownOption, Text, TextType } from "design-system-old";
import { Chips, ChipsWrapper } from "../../styled-components/label-renderer";

export function LabelRenderer(selected: DropdownOption[]) {
  selected = Array.isArray(selected) ? selected : [];
  const length = selected.length;
  if (length === 0) {
    return null;
  }
  return (
    <ChipsWrapper
      className="audit-logs-filter-label-renderer"
      data-testid="t--audit-logs-filter-label-renderer"
    >
      <Chips>
        <Text
          className="audit-logs-filter-label-renderer-text"
          type={TextType.P1}
        >
          {selected[0]?.label}
        </Text>
      </Chips>
      {length > 1 ? (
        <Chips>
          <Text type={TextType.P1}>+{length - 1}</Text>
        </Chips>
      ) : null}
    </ChipsWrapper>
  );
}
