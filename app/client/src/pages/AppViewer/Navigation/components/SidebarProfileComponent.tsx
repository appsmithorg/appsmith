import React from "react";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import ProfileDropdown from "pages/common/ProfileDropdown";
import styled from "styled-components";
import {
  getMenuItemBackgroundColorWhenActive,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import { NavigationSetting } from "constants/AppConstants";
import classNames from "classnames";

const StyledContainer = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  display: flex;
  align-items: center;
  border-top: 1px solid
    ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};
  padding: 12px 8px 0;
  margin-top: 12px;
`;

const StyledTextContainer = styled.div`
  margin-left: 8px;
`;

const StyledText = styled.div<{
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

type SidebarProfileComponent = {
  currentUser: User | undefined;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  isMinimal: boolean;
};

const SidebarProfileComponent = (props: SidebarProfileComponent) => {
  const { currentUser, isMinimal, navColorStyle, primaryColor } = props;

  return currentUser && currentUser.username !== ANONYMOUS_USERNAME ? (
    <StyledContainer
      className={classNames({ "justify-center": isMinimal })}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      <ProfileDropdown
        modifiers={{
          offset: {
            enabled: true,
            offset: `0, 0`,
          },
        }}
        name={currentUser.name}
        photoId={currentUser?.photoId}
        userName={currentUser?.username || ""}
      />

      {!isMinimal && (
        <StyledTextContainer>
          <StyledText navColorStyle={navColorStyle} primaryColor={primaryColor}>
            {currentUser.name}
          </StyledText>
          <StyledText
            isEmail
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          >
            {currentUser.email}
          </StyledText>
        </StyledTextContainer>
      )}
    </StyledContainer>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );
};

export default SidebarProfileComponent;
