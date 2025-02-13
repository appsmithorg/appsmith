import { useSelector } from "react-redux";
import {
  hasGitAppConnectPermission,
  hasGitAppManageAutoCommitPermission,
  hasGitAppManageDefaultBranchPermission,
  hasGitAppManageProtectedBranchesPermission,
} from "ee/utils/permissionHelpers";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";

export const useHasConnectToGitPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);

  return hasGitAppConnectPermission(currentApplication?.userPermissions);
};

export const useHasManageProtectedBranchesPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);

  return hasGitAppManageProtectedBranchesPermission(
    currentApplication?.userPermissions,
  );
};

export const useHasManageDefaultBranchPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);

  return hasGitAppManageDefaultBranchPermission(
    currentApplication?.userPermissions,
  );
};

export const useHasManageAutoCommitPermission = () => {
  const currentApplication = useSelector(getCurrentApplication);

  return hasGitAppManageAutoCommitPermission(
    currentApplication?.userPermissions,
  );
};
