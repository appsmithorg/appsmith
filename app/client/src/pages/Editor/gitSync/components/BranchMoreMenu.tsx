import React from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { deleteBranchInit } from "actions/gitSyncActions";
import { useDispatch, useSelector } from "react-redux";
import {
  createMessage,
  DELETE,
  DELETE_BRANCH_WARNING_CHECKED_OUT,
  DELETE_BRANCH_WARNING_DEFAULT,
} from "@appsmith/constants/messages";
import type { Dispatch } from "redux";
import type { GitApplicationMetadata } from "@appsmith/api/ApplicationApi";
import { getCurrentAppGitMetaData } from "@appsmith/selectors/applicationSelectors";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  toast,
} from "design-system";

interface Props {
  branchName: string;
  open: boolean;
  setOpen: (open: boolean) => void;
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
      toast.show(createMessage(DELETE_BRANCH_WARNING_DEFAULT, branchToDelete), {
        kind: "error",
      });
    } else if (currentBranch === branchToDelete) {
      toast.show(
        createMessage(DELETE_BRANCH_WARNING_CHECKED_OUT, branchToDelete),
        {
          kind: "error",
        },
      );
    } else {
      dispatch(deleteBranchInit({ branchToDelete: branchToDelete }));
    }
  }

  return (
    <MenuItem
      className="git-branch-more-menu-item danger t--branch-more-menu-delete error-menuitem"
      data-testid="t--branch-more-menu-delete"
      key={"delete-branch-button"}
      onClick={(e) => {
        e.stopPropagation();
        saneDelete();
      }}
      startIcon="delete"
    >
      {createMessage(DELETE)}
    </MenuItem>
  );
}

export default function BranchMoreMenu({ branchName, open, setOpen }: Props) {
  const dispatch = useDispatch();

  const buttons = [
    DeleteButton(branchName, useSelector(getCurrentAppGitMetaData), dispatch),
  ];

  const handleMenuClose = () => {
    setOpen(false);
  };

  return (
    <Menu data-testid="t--git-branch-more-menu" modal open={open}>
      <MenuTrigger>
        <Button
          className="git-branch-more-menu"
          isIconButton
          kind="tertiary"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            AnalyticsUtil.logEvent("GS_BRANCH_MORE_MENU_OPEN", {
              source: "GS_OPEN_BRANCH_LIST_POPUP",
            });
          }}
          size="sm"
          startIcon="comment-context-menu"
        />
      </MenuTrigger>
      <MenuContent
        align="end"
        onEscapeKeyDown={handleMenuClose}
        onPointerDownOutside={handleMenuClose}
      >
        {buttons}
      </MenuContent>
    </Menu>
  );
}
