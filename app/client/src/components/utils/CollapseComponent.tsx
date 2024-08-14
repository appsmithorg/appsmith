import React from "react";
import styled from "styled-components";
import { Collapse } from "@blueprintjs/core";
import { Icon } from "@appsmith/ads";

const CollapseWrapper = styled.div`
  position: relative;
  .collapse-title {
    color: var(--ads-v2-color-fg);
    letter-spacing: 0.04em;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    .icon {
      transition: transform 0.3s;
      cursor: pointer;
      &.collapse {
        transform: rotate(-180deg);
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
  openTitle?: string;
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
        {open && props.openTitle ? props.openTitle : props.title}
        <Icon
          className={`icon ${open ? "collapse" : ""}`}
          data-testid="datasource-collapse-icon"
          name="down-arrow"
          size="sm"
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
