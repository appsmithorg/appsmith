// temp file will be removed after git mod is fully rolled out

import { useSelector } from "react-redux";
import {
  getCurrentGitBranch,
  getIsGitConnected,
  protectedModeSelector,
} from "selectors/gitSyncSelectors";
import {
  useGitProtectedMode as useGitProtectedModeNew,
  useGitCurrentBranch as useGitCurrentBranchNew,
  useGitConnected as useGitConnectedNew,
} from "git";
import { selectGitModEnabled } from "selectors/gitModSelectors";

export function useGitModEnabled() {
  const isGitModEnabled = useSelector(selectGitModEnabled);

  return isGitModEnabled;
}

export function useGitCurrentBranch() {
  const isGitModEnabled = useGitModEnabled();
  const currentBranchOld = useSelector(getCurrentGitBranch) ?? null;
  const currentBranchNew = useGitCurrentBranchNew();

  return isGitModEnabled ? currentBranchNew : currentBranchOld;
}

export function useGitProtectedMode() {
  const isGitModEnabled = useGitModEnabled();
  const isProtectedModeOld = useSelector(protectedModeSelector);
  const isProtectedModeNew = useGitProtectedModeNew();

  return isGitModEnabled ? isProtectedModeNew : isProtectedModeOld;
}

export function useGitConnected() {
  const isGitModEnabled = useGitModEnabled();
  const isGitConnectedOld = useSelector(getIsGitConnected);
  const isGitConnectedNew = useGitConnectedNew();

  return isGitModEnabled ? isGitConnectedNew : isGitConnectedOld;
}
