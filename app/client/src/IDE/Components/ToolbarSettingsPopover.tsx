import React, { useCallback } from "react";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  ToggleButton,
} from "@appsmith/ads";
import styled, { css } from "styled-components";

interface Props {
  isOpen: boolean;
  handleOpenChange: (isOpen: boolean) => void;
  title: string;
  children: React.ReactNode;
  dataTestId?: string;
  disabled?: boolean;
}

const Variables = css`
  --popover-width: 280px;
`;
const StyledPopoverHeader = styled(PopoverHeader)`
  margin-bottom: var(--ads-v2-spaces-5);
`;

const StyledPopoverContent = styled(PopoverContent)`
  ${Variables};
`;

export const ToolbarSettingsPopover = (props: Props) => {
  const { handleOpenChange, isOpen, title } = props;
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
          data-testId={props.dataTestId}
          disabled={props.disabled}
          icon="settings-2-line"
          isSelected={isOpen}
          onClick={handleButtonClick}
          size="md"
        />
      </PopoverTrigger>
      <StyledPopoverContent
        align="end"
        onEscapeKeyDown={handleEscapeKeyDown}
        size="sm"
      >
        <StyledPopoverHeader isClosable>{title}</StyledPopoverHeader>
        <PopoverBody>{props.children}</PopoverBody>
      </StyledPopoverContent>
    </Popover>
  );
};
