import React from "react";
import type { CommonComponentProps } from "@appsmith/ads-old";
import { getInitials } from "utils/AppsmithUtils";
import {
  Menu,
  MenuItem,
  MenuContent,
  MenuSeparator,
  MenuTrigger,
  Text,
  Avatar,
} from "@appsmith/ads";
import styled from "styled-components";
import type { PopperModifiers } from "@blueprintjs/core";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "./CustomizedDropdown/dropdownHelpers";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { PROFILE } from "constants/routes";
import { ACCOUNT_TOOLTIP, createMessage } from "ee/constants/messages";
import type { NavigationSetting } from "constants/AppConstants";

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

const UserInformation = styled.div`
  display: flex;
  align-items: center;

  .user-username {
    flex-basis: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-name {
    flex-basis: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  function Profile(label?: string) {
    return (
      <Avatar
        className="t--profile-menu-icon cursor-pointer"
        firstLetter={getInitials(props.name || props.userName)}
        image={!!props.photoId ? `/api/v1/assets/${props.photoId}` : ""}
        label={label || ""}
        size="md"
      />
    );
  }

  return (
    <Menu>
      <MenuTrigger>{Profile(createMessage(ACCOUNT_TOOLTIP))}</MenuTrigger>
      <MenuContent align="end">
        <MenuItem className="menuitem-nohover">
          <UserInformation>
            <div className="user-image">
              {Profile(props.name || props.userName)}
            </div>
            <UserNameWrapper>
              <div className="user-name t--user-name">
                <Text kind="heading-s">{props.name}</Text>
              </div>

              <div className="user-username">
                <Text kind="body-s">{props.userName}</Text>
              </div>
            </UserNameWrapper>
          </UserInformation>
        </MenuItem>
        <MenuSeparator />
        {!props.hideEditProfileLink && (
          <MenuItem
            className={`t--edit-profile ${BlueprintClasses.POPOVER_DISMISS}`}
            onClick={() => {
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: PROFILE,
              });
            }}
            startIcon="pencil-line"
          >
            Edit profile
          </MenuItem>
        )}
        <MenuItem
          className="t--sign-out"
          onClick={() =>
            getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
              type: ReduxActionTypes.LOGOUT_USER_INIT,
            })
          }
          startIcon="logout"
        >
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
