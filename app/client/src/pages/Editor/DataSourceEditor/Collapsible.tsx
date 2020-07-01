import React from "react";
import { Collapse, Icon } from "@blueprintjs/core";
import styled from "styled-components";

const SectionLabel = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.17px;
  color: #4e5d78;
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

interface ComponentState {
  isOpen: boolean;
}

interface ComponentProps {
  children: any;
  title: string;
  defaultIsOpen: boolean;
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
    const { children, title } = this.props;
    const { isOpen } = this.state;

    return (
      <>
        <hr
          style={{
            border: "1px solid #D0D7DD",
            marginTop: 24,
            marginBottom: 24,
          }}
        />
        <SectionContainer
          data-cy={`section-${title}`}
          onClick={() => this.setState({ isOpen: !this.state.isOpen })}
        >
          <SectionLabel>{title}</SectionLabel>
          <Icon
            icon={isOpen ? "chevron-up" : "chevron-down"}
            iconSize={16}
            style={{ color: "#2E3D49" }}
          />
        </SectionContainer>

        <Collapse keepChildrenMounted={true} isOpen={this.state.isOpen}>
          {children}
        </Collapse>
      </>
    );
  }
}

export default Collapsible;
