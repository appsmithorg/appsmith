import React from "react";
import styled from "styled-components";

import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import { Colors } from "constants/Colors";
import { Icon } from "design-system";

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
        <Icon name="increase-control-v2" size="md" />
      </Wrapper>
    );
  }
};

export default EntityAddButton;
