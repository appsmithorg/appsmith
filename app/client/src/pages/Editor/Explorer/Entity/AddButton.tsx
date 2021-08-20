import React from "react";
import styled from "styled-components";

import { ControlIcons } from "icons/ControlIcons";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";

const Wrapper = styled(EntityTogglesWrapper)`
  &&& {
    & svg {
      cursor: ${(props) => (props.onClick ? "pointer" : "initial")};
    }
  }
`;

const PlusIcon = ControlIcons.INCREASE_CONTROL;

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
      <Wrapper className={props.className} onClick={handleClick}>
        <PlusIcon color="white" height={10} width={10} />
      </Wrapper>
    );
  }
};

export default EntityAddButton;
