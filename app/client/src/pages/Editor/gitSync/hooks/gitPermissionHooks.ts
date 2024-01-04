import { useSelector } from "react-redux";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import {
  hasConnectToGitPermission,
  hasManageProtectedBranchesPermission,
  hasManageDefaultBranchPermission,
  hasManageAutoCommitPermission,
} from "@appsmith/utils/permissionHelpers";

export const useHasConnectToGitPermission = () => {
  const workspace = useSelector(getCurrentAppWorkspace);
  return hasConnectToGitPermission(workspace.userPermissions);
};

export const useHasManageProtectedBranchesPermission = () => {
  const workspace = useSelector(getCurrentAppWorkspace);
  return hasManageProtectedBranchesPermission(workspace.userPermissions);
};

export const useHasManageDefaultBranchPermission = () => {
  const workspace = useSelector(getCurrentAppWorkspace);
  return hasManageDefaultBranchPermission(workspace.userPermissions);
};

export const useHasManageAutoCommitPermission = () => {
  const workspace = useSelector(getCurrentAppWorkspace);
  return hasManageAutoCommitPermission(workspace.userPermissions);
};
