import React from "react";
import styled from "styled-components";

import { ControlIcons } from "icons/ControlIcons";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import { Colors } from "constants/Colors";

const Wrapper = styled(EntityTogglesWrapper)`
  &&& {
    width: 30px;
    & svg {
      cursor: ${(props) => (props.onClick ? "pointer" : "initial")};
      path {
        fill: ${Colors.CODE_GRAY};
      }
    }
  }
  &.selected {
    background: ${Colors.SHARK2} !important;
    svg {
      path {
        fill: ${Colors.WHITE} !important;
      }
    }
  }
`;

const PlusIcon = ControlIcons.INCREASE_CONTROL_V2;

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
        <PlusIcon height={16} width={16} />
      </Wrapper>
    );
  }
};

export default EntityAddButton;
