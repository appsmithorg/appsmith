import classNames from "classnames";
import { Icon, IconName, IconSize } from "design-system";
import React from "react";
import styled from "styled-components";

export interface SectionHeaderProps {
  name: string;
  icon: IconName;
  subText: string;
  isSelected: boolean;
  onClick: () => void;
}

const StyledWrapper = styled.div`
  height: 50px;
`;

class SectionHeader extends React.Component<SectionHeaderProps> {
  render(): React.ReactNode {
    return (
      <StyledWrapper
        className={classNames({
          "flex flex-row items-center hover:bg-[#e7e7e7] cursor-pointer": true,
          "bg-[#e7e7e7]": this.props.isSelected,
        })}
        onClick={this.props.onClick}
      >
        <div className="basis-[7.5%]" />
        <Icon name={this.props.icon} size={IconSize.XL} />
        <div className="basis-[4.5%]" />
        <div className="flex flex-col">
          <text className="text-[14px] font-medium leading-[1.2rem]">
            {this.props.name}
          </text>
          <text className="text-[12px] leading-[1rem]">
            {this.props.subText}
          </text>
        </div>
      </StyledWrapper>
    );
  }
}

export default SectionHeader;
