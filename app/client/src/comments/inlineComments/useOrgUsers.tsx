import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getAllUsers,
  getCurrentAppOrg,
  getCurrentOrgId,
} from "selectors/organizationSelectors";
import useOrg from "utils/hooks/useOrg";

const useOrgUsers = () => {
  const dispatch = useDispatch();
  const orgId = useSelector(getCurrentOrgId);
  const orgUsers = useSelector(getAllUsers);
  const { id } = useSelector(getCurrentAppOrg) || {};
  const currentOrg = useOrg(id);

  // to check if user is added to an org
  const canInviteToOrg = isPermitted(
    currentOrg?.userPermissions || [],
    PERMISSION_TYPE.INVITE_USER_TO_ORGANIZATION,
  );

  useEffect(() => {
    if ((!orgUsers || !orgUsers.length) && canInviteToOrg) {
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
        payload: {
          orgId,
        },
      });
    }
  }, [orgId]);
  return orgUsers;
};

export default useOrgUsers;
