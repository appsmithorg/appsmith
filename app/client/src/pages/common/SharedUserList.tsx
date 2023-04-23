import React, { useMemo } from "react";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getUserApplicationsWorkspacesList } from "@appsmith/selectors/applicationSelectors";
import { AvatarGroup } from "design-system";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";

const UserImageContainer = styled.div<{ isMobile?: boolean }>`
  display: flex;
  margin-right: ${({ isMobile }) => (isMobile ? 0 : 24)}px;

  .workspace-share-user-icons {
    cursor: default;
    margin-right: -6px;
    width: 24px;
    height: 24px;
    border: 1px solid ${(props) => props.theme.colors.homepageBackground};
    display: inline-flex;
  }

  div.bp3-popover-arrow {
    display: inline-block;
    transform: translate(3px, 0px);
  }
`;

export default function SharedUserList(props: any) {
  const currentUser = useSelector(getCurrentUser);
  const userWorkspaces = useSelector(getUserApplicationsWorkspacesList);
  const isMobile = useIsMobileDevice();

  const convertUsersToAvatar = (users: any) => {
    return users.map((user: any) => {
      const name = user.name || user.username;
      return {
        label:
          user.username +
          (user.username === currentUser?.username ? " (You)" : ""),
        image: user.photoId
          ? `/api/${USER_PHOTO_ASSET_URL}/${user.photoId}`
          : undefined,
        firstLetter: name.charAt(0),
      };
    });
  };

  const allUsers = useMemo(() => {
    const workspace: any = userWorkspaces.find((workspaceObject: any) => {
      const { workspace } = workspaceObject;
      return workspace.id === props.workspaceId;
    });

    const { users } = workspace;
    const newUsers = users?.filter((user: any) => user.userId) || [];
    return convertUsersToAvatar(newUsers);
  }, [userWorkspaces]);
  return (
    <UserImageContainer isMobile={isMobile}>
      <AvatarGroup avatars={allUsers} size="sm" />
    </UserImageContainer>
  );
}
