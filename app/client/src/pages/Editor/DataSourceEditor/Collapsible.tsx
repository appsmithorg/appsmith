import React from "react";
import { Collapse, Icon } from "@blueprintjs/core";
import styled from "styled-components";
import { Icon as AdsIcon, IconName, IconSize } from "design-system";

const SectionLabel = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.17px;
  color: #4e5d78;
  display: flex;
  .cs-icon {
    margin-left: ${(props) => props.theme.spaces[2]}px;
  }
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 240px;
  cursor: pointer;
  margin-bottom: 5;
`;

const TopBorder = styled.div`
  height: 2px;
  background-color: #d0d7dd;
  margin-top: 24px;
  margin-bottom: 24px;
`;

interface ComponentState {
  isOpen: boolean;
}

interface ComponentProps {
  children: any;
  title: string;
  defaultIsOpen?: boolean;
  // header icon props of collapse header
  headerIcon?: {
    name: IconName;
    color?: string;
  };
}

type Props = ComponentProps;

class Collapsible extends React.Component<Props, ComponentState> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isOpen: props.defaultIsOpen || false,
    };
  }

  render() {
    const { children, headerIcon, title } = this.props;
    const { isOpen } = this.state;

    return (
      <>
        <TopBorder className="t--collapse-top-border" />
        <SectionContainer
          className="t--collapse-section-container"
          data-cy={`section-${title}`}
          data-replay-id={`section-${title}`}
          onClick={() => this.setState({ isOpen: !this.state.isOpen })}
        >
          <SectionLabel>
            {title}
            {headerIcon && (
              <AdsIcon
                fillColor={headerIcon.color}
                name={headerIcon.name}
                size={IconSize.MEDIUM}
              />
            )}
          </SectionLabel>
          <Icon
            icon={isOpen ? "chevron-up" : "chevron-down"}
            iconSize={16}
            style={{ color: "#2E3D49" }}
          />
        </SectionContainer>

        <Collapse isOpen={this.state.isOpen} keepChildrenMounted>
          {children}
        </Collapse>
      </>
    );
  }
}

export default Collapsible;
