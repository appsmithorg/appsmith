import React from "react";
import styled from "styled-components";
import SpinnerLoader from "pages/common/SpinnerLoader";
import { Button, Tooltip, Text } from "@appsmith/ads";
import { getTypographyByKey } from "@appsmith/ads-old";
import { capitalizeFirstLetter } from "utils/helpers";

interface QuickActionButtonProps {
  className?: string;
  count?: number;
  disabled?: boolean;
  icon: string;
  loading?: boolean;
  onClick: () => void;
  tooltipText: string;
}

const SpinnerContainer = styled.div`
  padding: 0 10px;
`;

const QuickActionButtonContainer = styled.div<{ disabled?: boolean }>`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
  display: block;
  position: relative;
  overflow: visible;
  opacity: ${({ disabled = false }) => (disabled ? 0.6 : 1)};
`;

const StyledCountText = styled(Text)`
  align-items: center;
  background-color: var(--ads-v2-color-bg-brand-secondary-emphasis-plus);
  color: var(--ads-v2-color-white);
  display: flex;
  justify-content: center;
  position: absolute;
  height: var(--ads-v2-spaces-5);
  top: ${(props) => -1 * props.theme.spaces[3]}px;
  left: ${(props) => props.theme.spaces[10]}px;
  border-radius: ${(props) => props.theme.spaces[3]}px;
  ${getTypographyByKey("p3")};
  z-index: 1;
  padding: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[2]}px;
`;

function QuickActionButton({
  className = "",
  count = 0,
  disabled = false,
  icon,
  loading = false,
  onClick,
  tooltipText,
}: QuickActionButtonProps) {
  const content = capitalizeFirstLetter(tooltipText);

  return (
    <QuickActionButtonContainer className={className} disabled={disabled}>
      {loading ? (
        <SpinnerContainer className="t--loader-quick-git-action">
          <SpinnerLoader size="md" />
        </SpinnerContainer>
      ) : (
        <Tooltip content={content}>
          <div>
            <Button
              isDisabled={disabled}
              isIconButton
              kind="tertiary"
              onClick={onClick}
              size="md"
              startIcon={icon}
            />
            {count > 0 && (
              <StyledCountText data-testid="t--bottom-bar-count">
                {count}
              </StyledCountText>
            )}
          </div>
        </Tooltip>
      )}
    </QuickActionButtonContainer>
  );
}

export default QuickActionButton;
