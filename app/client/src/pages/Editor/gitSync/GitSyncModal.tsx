import React from "react";
import Dialog from "components/ads/DialogComponent";
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
      <div>empty container</div>
    </Dialog>
  );
}

export default GitSyncModal;
