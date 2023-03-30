import React, { useState } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Menu, Toaster, Variant } from "design-system-old";
import { deleteBranchInit } from "actions/gitSyncActions";
import { useDispatch, useSelector } from "react-redux";
import {
  createMessage,
  DELETE,
  DELETE_BRANCH_WARNING_CHECKED_OUT,
  DELETE_BRANCH_WARNING_DEFAULT,
} from "@appsmith/constants/messages";
import DangerMenuItem from "./DangerMenuItem";
import type { Dispatch } from "redux";
import type { GitApplicationMetadata } from "@appsmith/api/ApplicationApi";
import { getCurrentAppGitMetaData } from "@appsmith/selectors/applicationSelectors";
import { Button } from "design-system";

interface Props {
  branchName: string;
}

function DeleteButton(
  branchToDelete: string,
  gitMetaData: GitApplicationMetadata,
  dispatch: Dispatch<any>,
) {
  const currentBranch = gitMetaData?.branchName || "";
  const defaultBranchName = gitMetaData?.defaultBranchName || "master";

  function saneDelete() {
    if (defaultBranchName === branchToDelete) {
      Toaster.show({
        text: createMessage(DELETE_BRANCH_WARNING_DEFAULT, branchToDelete),
        variant: Variant.danger,
      });
    } else if (currentBranch === branchToDelete) {
      Toaster.show({
        text: createMessage(DELETE_BRANCH_WARNING_CHECKED_OUT, branchToDelete),
        variant: Variant.danger,
      });
    } else {
      dispatch(deleteBranchInit({ branchToDelete: branchToDelete }));
    }
  }

  return (
    <DangerMenuItem
      className="git-branch-more-menu-item danger t--branch-more-menu-delete"
      data-cy="t--branch-more-menu-delete"
      data-testid="t--branch-more-menu-delete"
      icon="delete"
      key={"delete-branch-button"}
      onSelect={() => saneDelete()}
      selected
      text={createMessage(DELETE)}
    />
  );
}

function MenuButton(
  setOpen: (value: ((prevState: boolean) => boolean) | boolean) => void,
  open: boolean,
) {
  return (
    <Button
      isIconButton
      kind="tertiary"
      onClick={() => {
        AnalyticsUtil.logEvent("GS_BRANCH_MORE_MENU_OPEN", {
          source: "GS_OPEN_BRANCH_LIST_POPUP",
        });
        setOpen(!open);
      }}
      size="sm"
      startIcon="more-2-fill"
    />
  );
}

export default function BranchMoreMenu({ branchName }: Props) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const buttons = [
    DeleteButton(branchName, useSelector(getCurrentAppGitMetaData), dispatch),
  ];
  const menuButton = MenuButton(setOpen, open);

  return (
    <Menu
      className="git-branch-more-menu"
      data-testid="t--git-branch-more-menu"
      dontUsePortal
      isOpen={open}
      menuItemWrapperWidth={"fit-content"}
      position="bottom"
      target={menuButton}
    >
      {buttons}
    </Menu>
  );
}
