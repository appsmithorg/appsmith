import React from "react";
import { Text } from "design-system";
import { Chips, ChipsWrapper } from "../../styled-components/label-renderer";
import type { DropdownOptionProps } from "../../types";

export function LabelRenderer(selected: DropdownOptionProps[]) {
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
          color="var(--ads-v2-color-fg-emphasis)"
          kind="heading-s"
          renderAs="p"
        >
          {selected[0]?.label}
        </Text>
      </Chips>
      {length > 1 ? (
        <Chips>
          <Text
            color="var(--ads-v2-color-fg-emphasis)"
            kind="heading-s"
            renderAs="p"
          >
            +{length - 1}
          </Text>
        </Chips>
      ) : null}
    </ChipsWrapper>
  );
}
