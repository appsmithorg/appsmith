import classNames from "classnames";
import { Colors } from "constants/Colors";
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
    const hoverBgColor = `hover:bg-[${Colors.GREY_200.toLowerCase()}]`;
    const bgColor = `bg-[${Colors.GREY_200.toLowerCase()}]`;
    return (
      <StyledWrapper
        className={classNames({
          "flex flex-row items-center cursor-pointer": true,
          [hoverBgColor]: true,
          [bgColor]: this.props.isSelected,
        })}
        onClick={this.props.onClick}
      >
        <div className="basis-[7.5%]" />
        <Icon name={this.props.icon} size={IconSize.XL} />
        <div className="basis-[4.5%]" />
        <div className="flex flex-col">
          <div className="text-[14px] font-medium leading-[1.2rem]">
            {this.props.name}
          </div>
          <div className="text-[12px] leading-[1rem]">{this.props.subText}</div>
        </div>
      </StyledWrapper>
    );
  }
}

export default SectionHeader;
