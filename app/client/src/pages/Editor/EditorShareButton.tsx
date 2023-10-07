import React from "react";
import { Button, Tooltip } from "design-system";
import {
  EDITOR_HEADER,
  SHARE_BUTTON_TOOLTIP,
  SHARE_BUTTON_TOOLTIP_WITH_USER,
  createMessage,
} from "@appsmith/constants/messages";
import { getCurrentUser } from "selectors/usersSelectors";
import { getAllUsers } from "@appsmith/selectors/workspaceSelectors";
import { useSelector } from "react-redux";

export const EditorShareButton = ({
  setShowModal,
}: {
  setShowModal: (val: boolean) => void;
}) => {
  const sharedUserList = useSelector(getAllUsers);
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
