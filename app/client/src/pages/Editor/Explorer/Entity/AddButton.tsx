import React from "react";
import styled from "styled-components";
import type { ButtonSizes } from "design-system";
import { Button } from "design-system";

const Wrapper = styled.div<{ isSizePassed?: boolean }>`
  ${({ isSizePassed }) =>
    !isSizePassed &&
    `
    && {
      height: 36px;
      width: 30px;
    }
  `}

  &.selected {
    background-color: var(--ads-v2-color-bg-muted);
    border-radius: var(--ads-v2-border-radius);
  }
`;

const StyledButton = styled(Button)<{ isSizePassed?: boolean }>`
  ${({ isSizePassed }) =>
    !isSizePassed &&
    `
  && {
    height: 100%;
    width: 100%;
  }
  `}
`;

export const EntityAddButton = (props: {
  onClick?: () => void;
  className?: string;
  buttonSize?: ButtonSizes;
}) => {
  const handleClick = (e: any) => {
    props.onClick && props.onClick();
    e.stopPropagation();
  };
  if (!props.onClick) return null;
  else {
    return (
      <Wrapper className={props.className} isSizePassed={!!props.buttonSize}>
        <StyledButton
          isIconButton
          isSizePassed={!!props.buttonSize}
          kind="tertiary"
          onClick={handleClick}
          size={props.buttonSize}
          startIcon="plus"
        />
      </Wrapper>
    );
  }
};

export default EntityAddButton;
