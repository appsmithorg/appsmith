import React from "react";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { Collapse, Icon } from "@blueprintjs/core";

const CollapseWrapper = styled.div`
  position: relative;
  .collapse-title {
    color: ${Colors.GRAY_700};
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    /* justify-content: space-between; */
    .icon {
      transition: transform 0.3s;
      cursor: pointer;
      &.collapse {
        transform: rotate(-90deg);
      }
    }
  }
  && .bp3-collapse-body {
    position: relative;
    border: none;
    box-shadow: none;
    padding: 0;
  }
`;

function CollapseComponent(props: {
  children?: React.ReactNode;
  title?: string;
  isOpen?: boolean;
  titleStyle?: React.CSSProperties;
}) {
  const [open, toggleOpen] = React.useState(false);
  const handleIsOpen = () => {
    toggleOpen(!open);
  };
  if (!props.title) {
    return <div>{props.children ? props.children : null}</div>;
  }
  return (
    <CollapseWrapper>
      <div
        className="collapse-title"
        data-testid="datasource-collapse-wrapper"
        onClick={handleIsOpen}
        style={props.titleStyle}
      >
        {props.title}
        <Icon
          className={`icon ${open ? "collapse" : ""}`}
          color="#4B4848"
          data-testid="datasource-collapse-icon"
          icon="arrow-right"
          iconSize={12}
        />
      </div>
      <Collapse isOpen={open} keepChildrenMounted>
        <div className="inner-content">
          {props.children ? props.children : null}
        </div>
      </Collapse>
    </CollapseWrapper>
  );
}

export default CollapseComponent;
