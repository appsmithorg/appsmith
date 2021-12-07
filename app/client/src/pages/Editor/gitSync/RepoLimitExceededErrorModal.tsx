import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Dialog from "components/ads/DialogComponent";
import { getShowRepoLimitErrorModal } from "selectors/gitSyncSelectors";
import { setShowRepoLimitErrorModal } from "actions/gitSyncActions";
import Button, { Category } from "components/ads/Button";

function RepoLimitExceededErrorModal() {
  const isOpen = useSelector(getShowRepoLimitErrorModal);
  const dispatch = useDispatch();
  const onClose = () => dispatch(setShowRepoLimitErrorModal(false));

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      isOpen={!!isOpen}
      onClose={onClose}
    >
      <div>You may only connect N number of app to private repos</div>
      <Button
        category={Category.tertiary}
        onClick={() => {
          if (window.Intercom) {
            const myCustomMessage = "Hi there!";
            window.Intercom("showNewMessage", myCustomMessage);
            onClose();
          }
        }}
        text="Browse"
      />
    </Dialog>
  );
}

export default RepoLimitExceededErrorModal;
