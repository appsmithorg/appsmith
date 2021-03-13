import React, { Fragment } from "react";
import { CommonComponentProps, Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import styled, { createGlobalStyle } from "styled-components";
import { Position, Classes as BlueprintClasses } from "@blueprintjs/core";
import Menu from "components/ads/Menu";
import ThemeSwitcher from "./ThemeSwitcher";
import MenuDivider from "components/ads/MenuDivider";
import MenuItem from "components/ads/MenuItem";
import {
  getOnSelectAction,
  DropdownOnSelectActions,
} from "./CustomizedDropdown/dropdownHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import ProfileImage from "./ProfileImage";
import { PopperModifiers } from "@blueprintjs/core";
import { PROFILE } from "constants/routes";

type TagProps = CommonComponentProps & {
  onClick?: (text: string) => void;
  userName?: string;
  name: string;
  hideThemeSwitch?: boolean;
  modifiers?: PopperModifiers;
};

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
  padding: ${(props) => props.theme.spaces[6]}px;
  display: flex;
  align-items: center;

  .user-username {
    flex-basis: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.profileDropdown.userName};
    }
  }

  .user-name {
    flex-basis: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.profileDropdown.name};
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

export default function ProfileDropdown(props: TagProps) {
  const Profile = <ProfileImage userName={props.userName} />;

  return (
    <Fragment>
      <ProfileMenuStyle />
      <Menu
        className="profile-menu t--profile-menu"
        position={Position.BOTTOM}
        target={Profile}
        modifiers={props.modifiers}
      >
        <UserInformation>
          <div className="user-image">{Profile}</div>
          <UserNameWrapper>
            <div className="user-name t--user-name">
              <Text type={TextType.P1} highlight>
                {props.name}
              </Text>
            </div>

            <div className="user-username">
              <Text type={TextType.P3} highlight>
                {props.userName}
              </Text>
            </div>
          </UserNameWrapper>
        </UserInformation>
        <MenuDivider />
        {!props.hideThemeSwitch && (
          <>
            <ThemeSwitcher />
            <MenuDivider />
          </>
        )}
        <MenuItem
          icon="edit"
          text="Edit Profile"
          className={`t--edit-profile ${BlueprintClasses.POPOVER_DISMISS}`}
          onSelect={() => {
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: PROFILE,
            });
          }}
        />
        <MenuItem
          icon="logout"
          text="Sign Out"
          className="t--logout-icon"
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
