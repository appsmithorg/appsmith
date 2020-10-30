import { Classes, Collapse, Icon } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import React, { ReactNode, useState } from "react";
import styled from "styled-components";

const SectionWrapper = styled.div``;
const SectionTitle = styled.div`
  display: grid;
  grid-template-columns: 1fr 30px;
  & span {
    color: ${props => props.theme.colors.paneSectionLabel};
    padding: ${props => props.theme.spaces[2]}px 0;
    font-size: ${props => props.theme.fontSizes[3]}px;
    display: flex;
    font-weight: normal;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
    text-transform: uppercase;
  }
  & span.${Classes.ICON} {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    &.open-collapse {
      transform: rotate(90deg);
    }
  }
`;

export const PropertySection = (props: {
  name: string;
  children?: ReactNode;
  isDefaultOpen?: boolean;
}) => {
  const [isOpen, open] = useState(!!props.isDefaultOpen);
  return (
    <SectionWrapper>
      <SectionTitle>
        <span>{props.name}</span>
        <Icon
          icon={IconNames.CHEVRON_RIGHT}
          className={isOpen ? "open-collapse" : ""}
          onClick={() => open(!isOpen)}
        />
      </SectionTitle>
      <div style={{ position: "relative" }}>{props.children}</div>
      {/* {props.children && (
        <Collapse isOpen={isOpen} keepChildrenMounted>
          {props.children}
        </Collapse>
      )} */}
    </SectionWrapper>
  );
};

export default PropertySection;
