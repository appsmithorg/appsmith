import React from "react";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import styled from "styled-components";
import Tooltip from "components/editorComponents/Tooltip";
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
      <Tooltip content="Create" hoverOpenDelay={200}>
        <Wrapper onClick={handleClick}>
          <span>+</span>
        </Wrapper>
      </Tooltip>
    );
  }
};

export default EntityAddButton;
