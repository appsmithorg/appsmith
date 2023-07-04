import styled from "styled-components";
import { getMenuItemTextColor } from "pages/AppViewer/utils";
import type { NavigationSetting } from "constants/AppConstants";

export const StyledContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  display: flex;
  align-items: center;
  padding: 12px 8px 0;
`;

export const StyledTextContainer = styled.div`
  margin-left: 8px;
`;

export const StyledText = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  isEmail?: boolean;
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};

  ${({ isEmail }) => {
    if (isEmail) {
      return `
        font-size: 12px;
      `;
    }
  }}
`;
