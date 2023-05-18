import React from "react";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import ProfileDropdown from "pages/common/ProfileDropdown";
import type { NavigationSetting } from "constants/AppConstants";
import classNames from "classnames";
import {
  StyledContainer,
  StyledText,
  StyledTextContainer,
} from "./SidebarProfileComponent.styled";

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
        navColorStyle={navColorStyle}
        photoId={currentUser?.photoId}
        primaryColor={primaryColor}
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
