import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { getHasCreateWorkspacePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useSelector } from "react-redux";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

export const useIsGitAdmin = () => {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const tenantPermissions = useSelector(getTenantPermissions);
  const canCreateWorkspace = getHasCreateWorkspacePermission(
    isFeatureEnabled,
    tenantPermissions,
  );
  return canCreateWorkspace;
};
