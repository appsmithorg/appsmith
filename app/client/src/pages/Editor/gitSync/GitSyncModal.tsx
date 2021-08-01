import React from "react";
import Dialog from "components/ads/DialogComponent";
import Repository from "./Repository/Repository";
import Commit from "./Commit/Commit";

import { getIsGitSyncModalOpen } from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";

function GitSyncModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen(false));
  }, []);

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      isOpen={isModalOpen}
      onClose={handleClose}
    >
      <div>
        <Repository />
        <Commit />
      </div>
    </Dialog>
  );
}

export default GitSyncModal;
