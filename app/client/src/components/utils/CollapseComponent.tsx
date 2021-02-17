import React from "react";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { Collapse, Icon } from "@blueprintjs/core";

const CollapseWrapper = styled.div`
  position: relative;
  border-top: 1px solid #ffffff2e;
  padding: 12px;
  .collapse-title {
    color: ${Colors.CADET_BLUE};
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    display: flex;
    justify-content: space-between;
    .icon {
      transition: transform 0.3s;
      cursor: pointer;
      &.collapse {
        transform: rotate(-90deg);
      }
    }
  }
  .inner-content {
    margin-top: 12px;
  }
`;

const CollapseComponent = (props: {
  children?: React.ReactNode;
  title?: string;
  isOpen?: boolean;
}) => {
  const [open, toggleOpen] = React.useState(true);
  const handleIsOpen = () => {
    toggleOpen(!open);
  };
  if (!props.title) {
    return <div>{props.children ? props.children : null}</div>;
  }
  return (
    <CollapseWrapper>
      <div className="collapse-title">
        {props.title}
        <Icon
          icon="chevron-down"
          className={`icon ${!open ? "collapse" : ""}`}
          iconSize={16}
          onClick={handleIsOpen}
        />
      </div>
      <Collapse isOpen={open} keepChildrenMounted>
        <div className="inner-content">
          {props.children ? props.children : null}
        </div>
      </Collapse>
    </CollapseWrapper>
  );
};

export default CollapseComponent;
