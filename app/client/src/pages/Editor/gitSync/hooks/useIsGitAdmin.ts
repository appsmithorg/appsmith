import { useSelector } from "react-redux";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";

export const useIsGitAdmin = () => {
  const workspace = useSelector(getCurrentAppWorkspace);
  return hasCreateNewAppPermission(workspace.userPermissions);
};
