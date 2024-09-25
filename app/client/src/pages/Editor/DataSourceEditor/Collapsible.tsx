import React from "react";
import styled from "styled-components";
import { Icon } from "@appsmith/ads";

const SectionLabel = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.17px;
  color: var(--ads-v2-color-fg);
  display: flex;
  .ads-v2-icon {
    margin-left: ${(props) => props.theme.spaces[2]}px;
  }
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 270px;
  cursor: pointer;
  margin-bottom: 5px;
  margin-top: 24px;
`;

interface ComponentProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
  title: string;
  // header icon props of collapse header
  headerIcon?: {
    name: string;
    color?: string;
  };
  showSectionHeader?: boolean;
}

type Props = ComponentProps;

function Collapsible(props: Props) {
  const { children, headerIcon, showSectionHeader = true, title } = props;

  return (
    <section
      data-location-id={`section-${title}`}
      data-testid={`section-${title}`}
    >
      {showSectionHeader && (
        <SectionContainer className="t--collapse-section-container">
          <SectionLabel>
            {title}
            {headerIcon && <Icon name={headerIcon.name} size="md" />}
          </SectionLabel>
        </SectionContainer>
      )}
      {children}
    </section>
  );
}

export default Collapsible;
