import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import {
  hasConnectToGitPermission,
  hasManageAutoCommitPermission,
  hasManageDefaultBranchPermission,
  hasManageProtectedBranchesPermission,
} from "ee/utils/permissionHelpers";
import { useSelector } from "react-redux";

export const useHasConnectToGitPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);
  return hasConnectToGitPermission(currentApplication?.userPermissions);
};

export const useHasManageProtectedBranchesPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);
  return hasManageProtectedBranchesPermission(
    currentApplication?.userPermissions,
  );
};

export const useHasManageDefaultBranchPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);
  return hasManageDefaultBranchPermission(currentApplication?.userPermissions);
};

export const useHasManageAutoCommitPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);
  return hasManageAutoCommitPermission(currentApplication?.userPermissions);
};
