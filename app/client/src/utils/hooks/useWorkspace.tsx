import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";

import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { getCurrentApplication } from "selectors/editorSelectors";
import { hasInviteUserToApplicationPermission } from "@appsmith/utils/permissionHelpers";

const useWorkspace = (workspaceId: string) => {
  const dispatch = useDispatch();
  const workspace = useSelector(getCurrentAppWorkspace);
  const currentUser = useSelector(getCurrentUser);
  const currentApplicationDetails = useSelector(getCurrentApplication);

  const userWorkspacePermissions = workspace?.userPermissions ?? [];
  const userAppPermissions = currentApplicationDetails?.userPermissions ?? [];
  const canInviteToApplication = hasInviteUserToApplicationPermission([
    ...userWorkspacePermissions,
    ...userAppPermissions,
  ]);

  useEffect(() => {
    if (!currentUser || currentUser.username === ANONYMOUS_USERNAME) return;

    if (
      (!workspace || !workspace?.userPermissions) &&
      workspaceId &&
      canInviteToApplication
    ) {
      dispatch(fetchWorkspace(workspaceId, true));
    }
  }, [workspaceId, currentUser && currentUser.username]);

  return workspace;
};

export default useWorkspace;
