import { fetchWorkspace } from "actions/workspaceActions";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";

import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

const useWorkspace = (workspaceId: string) => {
  const dispatch = useDispatch();
  const workspace = useSelector(getCurrentAppWorkspace);
  const currentUser = useSelector(getCurrentUser);

  useEffect(() => {
    if (!currentUser || currentUser.username === ANONYMOUS_USERNAME) return;

    if ((!workspace || !workspace.userPermissions) && workspaceId) {
      dispatch(fetchWorkspace(workspaceId, true));
    }
  }, [workspaceId, currentUser && currentUser.username]);

  return workspace;
};

export default useWorkspace;
