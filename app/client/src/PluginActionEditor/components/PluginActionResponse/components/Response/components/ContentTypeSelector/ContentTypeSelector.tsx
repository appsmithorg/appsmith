import React from "react";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuGroupName,
  MenuGroup,
  MenuItem,
  Text,
} from "@appsmith/ads";
import { useBoolean } from "usehooks-ts";

import * as Styled from "./styles";

interface ContentTypeSelectorProps {
  currentContentType: string;
  contentTypeOptions: Array<{ label: string; value: string }>;
  isHovered: boolean;
  handleContentTypeChange: (e?: Event) => void;
}
export const ContentTypeSelector = (props: ContentTypeSelectorProps) => {
  const {
    contentTypeOptions,
    currentContentType,
    handleContentTypeChange,
    isHovered,
  } = props;

  const { toggle: toggleContentTypeMenuOpen, value: isOpen } =
    useBoolean(false);

  const isVisible = isHovered || isOpen;

  return (
    <Menu onOpenChange={toggleContentTypeMenuOpen}>
      <MenuTrigger>
        <Styled.Fab
          $isVisible={isVisible}
          aria-label={`Change response format. Current format: ${currentContentType}`}
          data-testid="t--query-response-type-trigger"
          endIcon={isOpen ? "arrow-up-s-line" : "arrow-down-s-line"}
          kind="secondary"
          startIcon={`content-type-${currentContentType.toLocaleLowerCase()}`}
        >
          {currentContentType}
        </Styled.Fab>
      </MenuTrigger>
      <MenuContent loop>
        <MenuGroupName asChild>
          <Text kind="body-s">View as</Text>
        </MenuGroupName>
        <MenuGroup>
          {contentTypeOptions.map(({ label, value }) => (
            <MenuItem
              data-testid="t--query-response-type-menu-item"
              data-value={value}
              key={value}
              onSelect={handleContentTypeChange}
              startIcon={`content-type-${value.toLocaleLowerCase()}`}
            >
              {label}
            </MenuItem>
          ))}
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
};
