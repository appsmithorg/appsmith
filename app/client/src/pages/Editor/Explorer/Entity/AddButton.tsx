import React from "react";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import styled from "styled-components";
const Wrapper = styled(EntityTogglesWrapper)`
  &&& {
    & > span {
      line-height: 16px;
    }
  }
`;
export const EntityAddButton = (props: { onClick?: () => void }) => {
  const handleClick = (e: any) => {
    props.onClick && props.onClick();
    e.stopPropagation();
  };
  if (!props.onClick) return null;
  else {
    return (
      <Wrapper onClick={handleClick}>
        <span>+</span>
      </Wrapper>
    );
  }
};

export default EntityAddButton;
