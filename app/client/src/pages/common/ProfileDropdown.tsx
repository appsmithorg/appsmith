import React, { Fragment } from "react";
import { CommonComponentProps, Classes } from "components/ads/common";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import { useSelector } from "react-redux";
import { getThemeDetails } from "selectors/themeSelectors";
import Text, { TextType } from "components/ads/Text";
import styled, { createGlobalStyle } from "styled-components";
import { Position } from "@blueprintjs/core";
import Menu from "components/ads/Menu";
import ThemeSwitcher from "./ThemeSwitcher";
import MenuDivider from "components/ads/MenuDivider";
import MenuItem from "components/ads/MenuItem";
import {
  getOnSelectAction,
  DropdownOnSelectActions,
} from "./CustomizedDropdown/dropdownHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

type TagProps = CommonComponentProps & {
  onClick?: (text: string) => void;
  userName?: string;
};

export const ProfileImage = styled.div<{ backgroundColor?: string }>`
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  justify-content: center;
  cursor: pointer;
  background-color: ${props => props.backgroundColor};
`;

const ProfileMenuStyle = createGlobalStyle`
  .bp3-popover {
    box-shadow: none;
  }
  .profile-menu {
    .bp3-popover .bp3-popover-content{
      margin-top: 2px;
    }
  }
`;

const UserInformation = styled.div`
  padding: ${props => props.theme.spaces[6]}px;
  display: flex;
  align-items: center;

  .user-name {
    flex-basis: 80%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    .${Classes.TEXT} {
      color: ${props => props.theme.colors.profileDropdown.userName};
    }
  }

  .user-image {
    margin-right: ${props => props.theme.spaces[4]}px;
    div {
      cursor: default;
    }
  }
`;

export default function ProfileDropdown(props: TagProps) {
  const themeDetails = useSelector(getThemeDetails);

  const initialsAndColorCode = getInitialsAndColorCode(
    props.userName,
    themeDetails.theme.colors.appCardColors,
  );

  const Profile = (
    <ProfileImage backgroundColor={initialsAndColorCode[1]}>
      <Text type={TextType.H6} highlight>
        {initialsAndColorCode[0]}
      </Text>
    </ProfileImage>
  );
  return (
    <Fragment>
      <ProfileMenuStyle />
      <Menu
        className="profile-menu"
        position={Position.BOTTOM}
        target={Profile}
      >
        <UserInformation>
          <div className="user-image">{Profile}</div>
          <div className="user-name">
            <Text type={TextType.P1} highlight>
              {props.userName}
            </Text>
          </div>
        </UserInformation>
        <MenuDivider />
        <ThemeSwitcher />
        <MenuDivider />
        <MenuItem
          icon="logout"
          text="Sign Out"
          onSelect={() =>
            getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
              type: ReduxActionTypes.LOGOUT_USER_INIT,
            })
          }
        />
      </Menu>
    </Fragment>
  );
}
