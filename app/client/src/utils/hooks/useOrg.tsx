import { fetchOrg } from "actions/orgActions";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";

import { getCurrentAppOrg } from "selectors/organizationSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

const useOrg = (orgId: string) => {
  const dispatch = useDispatch();
  const org = useSelector(getCurrentAppOrg);
  const currentUser = useSelector(getCurrentUser);

  useEffect(() => {
    if (!currentUser || currentUser.username === ANONYMOUS_USERNAME) return;

    if ((!org || !org.userPermissions) && orgId) {
      dispatch(fetchOrg(orgId, true));
    }
  }, [orgId, currentUser && currentUser.username]);

  return org;
};

export default useOrg;
