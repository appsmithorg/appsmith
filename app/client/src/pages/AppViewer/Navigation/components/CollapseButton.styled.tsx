import styled from "styled-components";
import {
  getApplicationNameTextColor,
  getMenuItemBackgroundColorOnHover,
} from "pages/AppViewer/utils";
import { Colors } from "constants/Colors";
import { NavigationSetting } from "constants/AppConstants";

export const StyledIconContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
`;

export const CollapseIconContainer = styled.div<{
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
