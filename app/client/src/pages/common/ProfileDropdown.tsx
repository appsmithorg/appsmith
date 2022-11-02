import React from "react";
import {
  Classes,
  CommonComponentProps,
  Menu,
  MenuDivider,
  MenuItem,
  Text,
  TextType,
  TooltipComponent,
} from "design-system";
import styled from "styled-components";
import {
  Classes as BlueprintClasses,
  PopperModifiers,
  Position,
} from "@blueprintjs/core";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "./CustomizedDropdown/dropdownHelpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import ProfileImage from "./ProfileImage";
import { PROFILE } from "constants/routes";
import { Colors } from "constants/Colors";
import { ACCOUNT_TOOLTIP, createMessage } from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";

type TagProps = CommonComponentProps & {
  onClick?: (text: string) => void;
  userName?: string;
  name: string;
  modifiers?: PopperModifiers;
  photoId?: string;
};

const StyledMenuItem = styled(MenuItem)`
  svg {
    width: 18px;
    height: 18px;
    fill: ${Colors.GRAY};

    path {
      fill: ${Colors.GRAY};
    }
  }

  .cs-text {
    color: ${Colors.CODE_GRAY};
    line-height: unset;
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
    <Menu
      className="profile-menu t--profile-menu"
      modifiers={props.modifiers}
      position={Position.BOTTOM_RIGHT}
      target={Profile}
    >
      <UserInformation>
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
      <MenuDivider />
      <StyledMenuItem
        className={`t--edit-profile ${BlueprintClasses.POPOVER_DISMISS}`}
        icon="edit-underline"
        onSelect={() => {
          getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
            path: PROFILE,
          });
        }}
        text="Edit Profile"
      />
      <StyledMenuItem
        className="t--logout-icon"
        icon="logout"
        onSelect={() =>
          getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
            type: ReduxActionTypes.LOGOUT_USER_INIT,
          })
        }
        text="Sign Out"
      />
    </Menu>
  );
}
