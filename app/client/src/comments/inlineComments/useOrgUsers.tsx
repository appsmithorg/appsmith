import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllUsers, getCurrentOrgId } from "selectors/organizationSelectors";

const useOrgUsers = () => {
  const dispatch = useDispatch();
  const orgId = useSelector(getCurrentOrgId);
  const orgUsers = useSelector(getAllUsers);
  useEffect(() => {
    if (!orgUsers || !orgUsers.length) {
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
