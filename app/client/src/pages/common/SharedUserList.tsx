import React from "react";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { AvatarGroup } from "@appsmith/ads";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import { getAllUsersOfWorkspace } from "ee/selectors/selectedWorkspaceSelectors";

const UserImageContainer = styled.div<{ isMobile?: boolean }>`
  display: flex;
  margin-right: ${({ isMobile }) => (isMobile ? 0 : 24)}px;

  div.bp3-popover-arrow {
    display: inline-block;
    transform: translate(3px, 0px);
  }
`;

export default function SharedUserList() {
  const currentUser = useSelector(getCurrentUser);
  const isMobile = useIsMobileDevice();
  const users = useSelector(getAllUsersOfWorkspace);

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertUsersToAvatar = (users: any) => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        className: "t--workspace-share-user-icons",
      };
    });
  };

  return (
    <UserImageContainer isMobile={isMobile}>
      <AvatarGroup avatars={convertUsersToAvatar(users || [])} size="sm" />
    </UserImageContainer>
  );
}
