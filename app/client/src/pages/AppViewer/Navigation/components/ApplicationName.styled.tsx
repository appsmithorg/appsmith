import styled from "styled-components";
import { getApplicationNameTextColor } from "pages/AppViewer/utils";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import { NavigationSetting } from "constants/AppConstants";

export const StyledApplicationName = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  forSidebar?: boolean;
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
  font-size: ${({ forSidebar }) =>
    forSidebar ? THEMEING_TEXT_SIZES.sm : THEMEING_TEXT_SIZES.base};
  max-width: 224px;
`;
