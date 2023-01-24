import {
  CLOSE_SIDEBAR_MESSAGE,
  createMessage,
  LOCK_SIDEBAR_MESSAGE,
} from "@appsmith/constants/messages";
import classNames from "classnames";
import { TooltipComponent } from "design-system-old";
import React from "react";
import styled from "styled-components";
import { ReactComponent as UnpinIcon } from "assets/icons/ads/double-arrow-right.svg";
import { ReactComponent as PinIcon } from "assets/icons/ads/double-arrow-left.svg";
import { NavigationSetting } from "constants/AppConstants";
import {
  getApplicationNameTextColor,
  getMenuItemBackgroundColorOnHover,
} from "pages/AppViewer/utils";
import { Colors } from "constants/Colors";

const StyledIconContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
`;

const CollapseIconContainer = styled.div<{
  borderRadius: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  isOpen: boolean;
  isPinned: boolean;
}>`
  height: 24px;
  width: 24px;
  transition: background 0.3s ease-in-out;
  border-radius: ${({ borderRadius }) => borderRadius};

  :hover {
    background: ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};
  }

  ${({ isOpen, isPinned }) => {
    if (!isPinned && !isOpen) {
      return `
        transform: translateX(40px);
        background: ${Colors.WHITE};
        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06);
        transition: background 0.3s ease-in-out, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        transition-delay: 0.2s;

        ${StyledIconContainer} {
          color: ${Colors.GRAY_500};
        }

        :hover {
          background: ${Colors.GREY_3};
        }
      `;
    }
  }}
`;

type CollapseButtonProps = {
  borderRadius: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["navStyle"];
  isOpen: boolean;
  isPinned: boolean;
  setIsPinned: (isPinned: boolean) => void;
};

const CollapseButton = (props: CollapseButtonProps) => {
  const {
    borderRadius,
    isOpen,
    isPinned,
    navColorStyle,
    primaryColor,
    setIsPinned,
  } = props;

  const handleOnClick = () => {
    setIsPinned(!isPinned);
  };

  return (
    <TooltipComponent
      content={
        <div className="flex items-center justify-between">
          <span>
            {!isPinned
              ? createMessage(LOCK_SIDEBAR_MESSAGE)
              : createMessage(CLOSE_SIDEBAR_MESSAGE)}
          </span>
        </div>
      }
      position="bottom-left"
    >
      <CollapseIconContainer
        borderRadius={borderRadius}
        className={classNames({
          "relative flex items-center justify-center p-0 text-gray-800 transition-all transform duration-400 cursor-pointer": true,
        })}
        isOpen={isOpen}
        isPinned={isPinned}
        navColorStyle={navColorStyle}
        onClick={handleOnClick}
        primaryColor={primaryColor}
      >
        <StyledIconContainer
          className="relative w-4 h-4 group flex items-center justify-center"
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        >
          {!isPinned ? (
            <UnpinIcon className="absolute w-3.5 h-3.5" />
          ) : (
            <PinIcon className="absolute w-3.5 h-3.5" />
          )}
        </StyledIconContainer>
      </CollapseIconContainer>
    </TooltipComponent>
  );
};

export default CollapseButton;
