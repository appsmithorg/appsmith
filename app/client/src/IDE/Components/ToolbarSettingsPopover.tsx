import React, { useCallback } from "react";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  ToggleButton,
} from "@appsmith/ads";
import styled from "styled-components";

interface Props {
  isOpen: boolean;
  handleOpenChange: (isOpen: boolean) => void;
  title: string;
  children: React.ReactNode;
  dataTestId?: string;
  disabled?: boolean;
  popoverWidth?: string;
}

const StyledPopoverHeader = styled(PopoverHeader)`
  margin-bottom: var(--ads-v2-spaces-5);
`;

const StyledPopoverContent = styled(PopoverContent)<{ popoverWidth?: string }>`
  min-width: 280px;
  max-width: ${({ popoverWidth }) => (popoverWidth ? popoverWidth : "280px")};
  width: fit-content;
`;

export const ToolbarSettingsPopover = (props: Props) => {
  const { handleOpenChange, isOpen, popoverWidth, title } = props;
  const handleButtonClick = useCallback(() => {
    handleOpenChange(true);
  }, [handleOpenChange]);

  const handleEscapeKeyDown = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <PopoverTrigger>
        <ToggleButton
          data-testid={props.dataTestId}
          disabled={props.disabled}
          icon="settings-v3"
          isSelected={isOpen}
          onClick={handleButtonClick}
          size="md"
        />
      </PopoverTrigger>
      <StyledPopoverContent
        align="end"
        onEscapeKeyDown={handleEscapeKeyDown}
        popoverWidth={popoverWidth}
        size="sm"
      >
        <StyledPopoverHeader isClosable>{title}</StyledPopoverHeader>
        <PopoverBody>{props.children}</PopoverBody>
      </StyledPopoverContent>
    </Popover>
  );
};
