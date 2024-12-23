import React, { useCallback } from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  createMessage,
  DELETE,
  DELETE_BRANCH_WARNING_CHECKED_OUT,
  DELETE_BRANCH_WARNING_DEFAULT,
} from "ee/constants/messages";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  toast,
} from "@appsmith/ads";
import noop from "lodash/noop";

interface DeleteButtonProps {
  branch: string | null;
  currentBranch: string | null;
  defaultBranch: string | null;
  deleteBranch: (branch: string) => void;
}

function DeleteButton({
  branch = null,
  currentBranch = null,
  defaultBranch = null,
  deleteBranch = noop,
}: DeleteButtonProps) {
  const saneDelete = useCallback(() => {
    if (branch) {
      if (defaultBranch === branch) {
        toast.show(createMessage(DELETE_BRANCH_WARNING_DEFAULT, branch), {
          kind: "error",
        });
      } else if (currentBranch === branch) {
        toast.show(createMessage(DELETE_BRANCH_WARNING_CHECKED_OUT, branch), {
          kind: "error",
        });
      } else {
        deleteBranch(branch);
      }
    }
  }, [branch, currentBranch, defaultBranch, deleteBranch]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      saneDelete();
    },
    [saneDelete],
  );

  return (
    <MenuItem
      className="git-branch-more-menu-item danger t--branch-more-menu-delete error-menuitem"
      data-testid="t--branch-more-menu-delete"
      key={"delete-branch-button"}
      onClick={handleClick}
      startIcon="delete"
    >
      {createMessage(DELETE)}
    </MenuItem>
  );
}

interface BranchMoreMenuProps {
  branch: string | null;
  currentBranch: string | null;
  defaultBranch: string | null;
  deleteBranch: (branch: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function BranchMoreMenu({
  branch = null,
  currentBranch = null,
  defaultBranch = null,
  deleteBranch = noop,
  open,
  setOpen,
}: BranchMoreMenuProps) {
  const buttons = [
    <DeleteButton
      branch={branch}
      currentBranch={currentBranch}
      defaultBranch={defaultBranch}
      deleteBranch={deleteBranch}
      key={`delete-branch-${branch}`}
    />,
  ];

  const handleMenuClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleClickOnMenu = useCallback(
    (e) => {
      e.stopPropagation();
      setOpen(true);
      AnalyticsUtil.logEvent("GS_BRANCH_MORE_MENU_OPEN", {
        source: "GS_OPEN_BRANCH_LIST_POPUP",
      });
    },
    [setOpen],
  );

  return (
    <Menu data-testid="t--git-branch-more-menu" modal open={open}>
      <MenuTrigger>
        <Button
          className="git-branch-more-menu"
          isIconButton
          kind="tertiary"
          onClick={handleClickOnMenu}
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
