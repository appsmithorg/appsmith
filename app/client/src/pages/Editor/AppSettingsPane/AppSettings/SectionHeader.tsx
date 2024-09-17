import React from "react";
import styled from "styled-components";
import { Icon } from "@appsmith/ads";

export interface SectionHeaderProps {
  id: string;
  name: string;
  icon: string;
  subText: string;
  isSelected: boolean;
  onClick: () => void;
}

const StyledWrapper = styled.div<{ isSelected: boolean }>`
  height: 50px;
  background-color: ${({ isSelected }) =>
    isSelected ? "var(--ads-v2-color-bg-muted)" : "transparent"};

  &:hover {
    background-color: ${({ isSelected }) =>
      isSelected
        ? "var(--ads-v2-color-bg-muted)"
        : "var(--ads-v2-color-bg-subtle)"};
  }
`;

const Title = styled.p`
  font-size: 14px;
  line-height: 1.2rem;
  font-weight: var(--ads-v2-font-weight-bold);
  color: var(--ads-v2-color-fg-emphasis);
`;

const SubTitle = styled.div`
  font-size: 12px;
  line-height: 1rem;
  color: var(--ads-v2-color-fg);
`;

class SectionHeader extends React.Component<SectionHeaderProps> {
  render(): React.ReactNode {
    return (
      <StyledWrapper
        className="flex flex-row items-center cursor-pointer"
        id={this.props.id}
        isSelected={this.props.isSelected}
        onClick={this.props.onClick}
      >
        <div className="basis-[7.5%]" />
        <Icon name={this.props.icon} size="md" />
        <div className="basis-[4.5%]" />
        <div className="flex flex-col">
          <Title>{this.props.name}</Title>
          <SubTitle>{this.props.subText}</SubTitle>
        </div>
      </StyledWrapper>
    );
  }
}

export default SectionHeader;
