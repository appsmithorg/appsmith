import React from "react";
import type { CommonComponentProps } from "design-system-old";
import {
  Classes,
  Menu,
  MenuDivider,
  MenuItem,
  Text,
  TextType,
  TooltipComponent,
} from "design-system-old";
import styled from "styled-components";
import type { PopperModifiers } from "@blueprintjs/core";
import { Classes as BlueprintClasses, Position } from "@blueprintjs/core";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "./CustomizedDropdown/dropdownHelpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import ProfileImage from "./ProfileImage";
import { PROFILE } from "constants/routes";
import { ACCOUNT_TOOLTIP, createMessage } from "@appsmith/constants/messages";
import type { NavigationSetting } from "constants/AppConstants";
import {
  NAVIGATION_SETTINGS,
  TOOLTIP_HOVER_ON_DELAY,
} from "constants/AppConstants";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { get } from "lodash";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";

type TagProps = CommonComponentProps & {
  onClick?: (text: string) => void;
  userName?: string;
  name: string;
  modifiers?: PopperModifiers;
  photoId?: string;
  hideEditProfileLink?: boolean;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
};

const StyledMenu = styled(Menu)<{
  borderRadius: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  .bp3-popover {
    border-radius: ${({ borderRadius }) =>
      `min(${borderRadius}, 0.375rem) !important`};
    overflow: hidden;
  }

  .bp3-popover-content > div {
    background-color: ${({ primaryColor }) =>
      getMenuContainerBackgroundColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      )} !important;
  }
`;

const StyledMenuItem = styled(MenuItem)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  svg {
    width: 18px;
    height: 18px;
    fill: ${({ primaryColor }) =>
      getMenuItemTextColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        true,
      )} !important;

    path {
      fill: ${({ primaryColor }) =>
        getMenuItemTextColor(
          primaryColor,
          NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
          true,
        )} !important;
    }
  }

  .cs-text {
    color: ${({ primaryColor }) =>
      getMenuItemTextColor(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
        true,
      )};
    line-height: unset;
  }

  &:hover {
    background-color: ${({ primaryColor }) =>
      getMenuItemBackgroundColorOnHover(
        primaryColor,
        NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      )};
  }
`;

const UserInformation = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  padding: ${(props) => props.theme.spaces[6]}px;
  display: flex;
  align-items: center;

  .user-username {
    flex-basis: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .${Classes.TEXT} {
      color: ${({ primaryColor }) =>
        getMenuItemTextColor(
          primaryColor,
          NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
          true,
        )};
    }
  }

  .user-name {
    flex-basis: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .${Classes.TEXT} {
      color: ${({ primaryColor }) =>
        getMenuItemTextColor(
          primaryColor,
          NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
          true,
        )};
    }
  }

  .user-image {
    margin-right: ${(props) => props.theme.spaces[4]}px;

    div {
      cursor: default;
    }
  }
`;

const UserNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  // To make flex child fit in container
  min-width: 0;
`;

const StyledMenuDivider = styled(MenuDivider)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  ${({ theme }) =>
    `border-top: 1px solid ${theme.colors.header.tabsHorizontalSeparator}`}
`;

export default function ProfileDropdown(props: TagProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const borderRadius = get(
    selectedTheme,
    "properties.borderRadius.appBorderRadius",
    "inherit",
  );

  const Profile = (
    <TooltipComponent
      content={createMessage(ACCOUNT_TOOLTIP)}
      hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
      position="bottom-right"
    >
      <ProfileImage
        className="t--profile-menu-icon"
        size={34}
        source={!!props.photoId ? `/api/v1/assets/${props.photoId}` : ""}
        userName={props.name || props.userName}
      />
    </TooltipComponent>
  );

  return (
    <StyledMenu
      borderRadius={borderRadius}
      className="profile-menu t--profile-menu"
      modifiers={props.modifiers}
      navColorStyle={props.navColorStyle}
      position={Position.BOTTOM_RIGHT}
      primaryColor={props.primaryColor}
      target={Profile}
    >
      <UserInformation
        navColorStyle={props.navColorStyle}
        primaryColor={props.primaryColor}
      >
        <div className="user-image">{Profile}</div>
        <UserNameWrapper>
          <div className="user-name t--user-name">
            <Text highlight type={TextType.P1}>
              {props.name}
            </Text>
          </div>

          <div className="user-username">
            <Text highlight type={TextType.P3}>
              {props.userName}
            </Text>
          </div>
        </UserNameWrapper>
      </UserInformation>
      <StyledMenuDivider
        navColorStyle={props.navColorStyle}
        primaryColor={props.primaryColor}
      />
      {!props.hideEditProfileLink && (
        <StyledMenuItem
          className={`t--edit-profile ${BlueprintClasses.POPOVER_DISMISS}`}
          icon="edit-underline"
          navColorStyle={props.navColorStyle}
          onSelect={() => {
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: PROFILE,
            });
          }}
          primaryColor={props.primaryColor}
          text="Edit Profile"
        />
      )}
      <StyledMenuItem
        className="t--logout-icon"
        icon="logout"
        navColorStyle={props.navColorStyle}
        onSelect={() =>
          getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
            type: ReduxActionTypes.LOGOUT_USER_INIT,
          })
        }
        primaryColor={props.primaryColor}
        text="Sign Out"
      />
    </StyledMenu>
  );
}
