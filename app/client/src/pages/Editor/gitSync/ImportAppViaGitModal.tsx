import { setIsImportAppViaGitModalOpen } from "actions/gitSyncActions";
import DialogComponent from "components/ads/DialogComponent";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getIsImportAppViaGitModalOpen } from "selectors/gitSyncSelectors";
import GitConnection from "./Tabs/GitConnection";

export default function ImportAppViaGitModal() {
  const isOpen = useSelector(getIsImportAppViaGitModalOpen);
  const dispatch = useDispatch();

  return (
    <DialogComponent
      canEscapeKeyClose
      canOutsideClickClose
      isOpen={isOpen}
      maxHeight={"80vh"}
      onClose={() => dispatch(setIsImportAppViaGitModalOpen({ isOpen: false }))}
      showHeaderUnderline
      width={"580px"}
    >
      <GitConnection isImport />
    </DialogComponent>
  );
}
