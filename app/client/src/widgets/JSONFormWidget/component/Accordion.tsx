import React, { useState } from "react";
import styled from "styled-components";
import { Collapse, Icon } from "@blueprintjs/core";

type AccordionProps = React.PropsWithChildren<{
  className?: string;
  collapsible: boolean;
  onDelete?: () => void;
  title?: string;
}>;

type StyledToggleHeaderTextProps = {
  isOpen: boolean;
};

type StyledCollapseProps = {
  isHeaderVisible: boolean;
};

const HEADER_HEIGHT = 40;
const COLLAPSE_PADDING_X = 8;
const COLLAPSE_PADDING_Y = 16;

const StyledToggleHeader = styled.div`
  border-radius: 4px;
  display: flex;
  height: ${HEADER_HEIGHT}px;
  justify-content: space-between;
  left: 0;
  padding: ${COLLAPSE_PADDING_Y}px ${COLLAPSE_PADDING_X}px;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 10;
`;

const StyledToggleHeaderText = styled.span<StyledToggleHeaderTextProps>`
  background: #fff;
  color: ${({ isOpen }) => isOpen && "#fff"};
  width: 100%;
`;

const StyledWrapper = styled.div`
  border: 1px solid #ebebeb;
  min-height: ${HEADER_HEIGHT}px;
  padding: ${COLLAPSE_PADDING_Y}px ${COLLAPSE_PADDING_X}px;
  position: relative;
`;

const StyledFixedHeader = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StyledCollapse = styled(Collapse)<StyledCollapseProps>`
  margin-top: ${({ isHeaderVisible }) =>
    isHeaderVisible ? `${HEADER_HEIGHT}px` : 0};
`;

function Accordion({
  children,
  className,
  collapsible,
  onDelete,
  title,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleIsOpen = () => setIsOpen((prevState) => !prevState);

  const isHeaderVisible = collapsible || Boolean(onDelete);

  const header = collapsible ? (
    <StyledToggleHeader onClick={toggleIsOpen} role="button" tabIndex={0}>
      <StyledToggleHeaderText isOpen={isOpen}>{title}</StyledToggleHeaderText>
      <Icon
        icon={isOpen ? "chevron-up" : "chevron-down"}
        iconSize={16}
        style={{ color: "#2E3D49" }}
      />
    </StyledToggleHeader>
  ) : (
    <StyledFixedHeader>
      <button>
        <Icon icon="trash" iconSize={16} style={{ color: "#D71010" }} />
        <p>Delete</p>
      </button>
    </StyledFixedHeader>
  );

  return (
    <StyledWrapper className={className}>
      {isHeaderVisible && header}
      <StyledCollapse isHeaderVisible={isHeaderVisible} isOpen={isOpen}>
        {children}
      </StyledCollapse>
    </StyledWrapper>
  );
}

export default Accordion;
