import { Org } from "constants/orgConstants";
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

const getCanManage = (currentOrg: Org) => {
  const userOrgPermissions = currentOrg.userPermissions || [];
  const canManage = isPermitted(
    userOrgPermissions,
    PERMISSION_TYPE.MANAGE_ORGANIZATION,
  );
  return canManage;
};

const useOrgUsers = () => {
  const dispatch = useDispatch();
  const orgId = useSelector(getCurrentOrgId);
  const orgUsers = useSelector(getAllUsers);
  const { id } = useSelector(getCurrentAppOrg) || {};
  const currentOrg = useOrg(id);
  const canManage = getCanManage(currentOrg);

  useEffect(() => {
    if ((!orgUsers || !orgUsers.length) && canManage) {
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
