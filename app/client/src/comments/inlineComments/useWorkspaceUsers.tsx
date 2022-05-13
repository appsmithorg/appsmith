import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getAllUsers,
  getCurrentAppWorkspace,
  getCurrentWorkspaceId,
} from "selectors/workspaceSelectors";
import useWorkspace from "utils/hooks/useWorkspace";

const useWorkspaceUsers = () => {
  const dispatch = useDispatch();
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const workspaceUsers = useSelector(getAllUsers);
  const { id } = useSelector(getCurrentAppWorkspace) || {};
  const currentWorkspace = useWorkspace(id);

  // to check if user is added to an workspace
  const canInviteToWorkspace = isPermitted(
    currentWorkspace?.userPermissions || [],
    PERMISSION_TYPE.INVITE_USER_TO_WORKSPACE,
  );

  useEffect(() => {
    if ((!workspaceUsers || !workspaceUsers.length) && canInviteToWorkspace) {
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
        payload: {
          workspaceId,
        },
      });
    }
  }, [workspaceId]);
  return workspaceUsers;
};

export default useWorkspaceUsers;
