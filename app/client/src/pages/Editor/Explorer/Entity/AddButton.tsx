import React from "react";
import styled from "styled-components";
import { Button } from "design-system";

const Wrapper = styled.div`
  height: 36px;
  width: 30px;
`;

const StyledButton = styled(Button)`
  && {
    height: 100%;
    width: 100%;
  }
`;

export const EntityAddButton = (props: {
  onClick?: () => void;
  className?: string;
}) => {
  const handleClick = (e: any) => {
    props.onClick && props.onClick();
    e.stopPropagation();
  };
  if (!props.onClick) return null;
  else {
    return (
      <Wrapper className={props.className}>
        <StyledButton
          isIconButton
          kind="tertiary"
          onClick={handleClick}
          startIcon="increase-control-v2"
        />
      </Wrapper>
    );
  }
};

export default EntityAddButton;
