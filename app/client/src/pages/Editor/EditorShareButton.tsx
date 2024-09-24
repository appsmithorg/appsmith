import React from "react";
import { Button, Tooltip } from "@appsmith/ads";
import {
  EDITOR_HEADER,
  SHARE_BUTTON_TOOLTIP,
  SHARE_BUTTON_TOOLTIP_WITH_USER,
  createMessage,
} from "ee/constants/messages";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import { getAllUsersOfWorkspace } from "ee/selectors/selectedWorkspaceSelectors";

export const EditorShareButton = ({
  setShowModal,
}: {
  setShowModal: (val: boolean) => void;
}) => {
  const sharedUserList = useSelector(getAllUsersOfWorkspace);
  const currentUser = useSelector(getCurrentUser);
  const filteredSharedUserList = sharedUserList.filter(
    (user) => user.username !== currentUser?.username,
  );

  return (
    <Tooltip
      content={
        filteredSharedUserList.length
          ? createMessage(
              SHARE_BUTTON_TOOLTIP_WITH_USER(filteredSharedUserList.length),
            )
          : createMessage(SHARE_BUTTON_TOOLTIP)
      }
      placement="bottom"
    >
      <Button
        className="t--application-share-btn"
        kind="tertiary"
        onClick={() => setShowModal(true)}
        size="md"
        startIcon="share-line"
      >
        {createMessage(EDITOR_HEADER.share)}
      </Button>
    </Tooltip>
  );
};
