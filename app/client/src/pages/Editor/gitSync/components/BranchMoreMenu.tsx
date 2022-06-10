import React, { useState } from "react";
import { Colors } from "constants/Colors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { IconSize, Toaster, Variant } from "components/ads";
import Icon from "components/ads/Icon";
import Menu from "components/ads/Menu";
import { deleteBranchInit } from "actions/gitSyncActions";
import { useDispatch, useSelector } from "react-redux";
import {
  createMessage,
  DELETE,
  DELETE_BRANCH_WARNING_CHECKED_OUT,
  DELETE_BRANCH_WARNING_DEFAULT,
} from "@appsmith/constants/messages";
import DangerMenuItem from "./DangerMenuItem";
import { Dispatch } from "redux";
import { GitApplicationMetadata } from "api/ApplicationApi";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";

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
    <Icon
      fillColor={Colors.DARK_GRAY}
      hoverFillColor={Colors.GRAY_900}
      name="more-2-fill"
      onClick={() => {
        AnalyticsUtil.logEvent("GS_BRANCH_MORE_MENU_OPEN", {
          source: "GS_OPEN_BRANCH_LIST_POPUP",
        });
        setOpen(!open);
      }}
      size={IconSize.XXXXL}
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
